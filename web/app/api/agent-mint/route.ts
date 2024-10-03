import { NextResponse } from 'next/server';
import { Program, web3, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { NftGameAgentProgram, getNftGameAgentProgram } from '@casino-of-life-dashboard/anchor';
import Gun from 'gun';

// Initialize Gun
const gun = Gun();

export async function POST(request: Request) {
  try {
    const { action, wallet, ...data } = await request.json();

    const connection = initializeConnection();
    const provider = createReadOnlyProvider(connection, wallet);
    const program = getNftGameAgentProgram(provider);

    switch (action) {
      case 'createCollection':
        return handleCreateCollection(program as unknown as Program<Idl>, data);
      case 'mintAIAgent':
        return handleMintAIAgent(program as unknown as Program<Idl>, data);
      case 'initializeTreasury':
        return handleInitializeTreasury(program);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in agent-mint API:', error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}

function initializeConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (!rpcUrl) {
    throw new Error('NEXT_PUBLIC_SOLANA_RPC_URL is not set');
  }
  return new Connection(
    rpcUrl.startsWith('http') ? rpcUrl : `https://${rpcUrl}`,
    'confirmed'
  );
}

function createReadOnlyProvider(connection: Connection, wallet: string): AnchorProvider {
  return new AnchorProvider(
    connection, 
    {
      publicKey: new PublicKey(wallet),
      signTransaction: async () => { throw new Error('Signing not available in read-only mode'); },
      signAllTransactions: async () => { throw new Error('Signing not available in read-only mode'); },
    },
    { commitment: 'confirmed' }
  );
}

async function handleCreateCollection(program: Program<Idl>, data: any) {
  const { transaction, collectionId } = await createCollectionTransaction(program, data.name, data.symbol, data.strategy);
  
  // Get a recent blockhash
  const { blockhash } = await program.provider.connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = program.provider.publicKey;

  return NextResponse.json({ 
    transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
    collectionId: collectionId.toString()
  });
}

async function handleMintAIAgent(program: Program<Idl>, data: any) {
  const { transaction, agentId } = await mintAIAgentTransaction(
    program, 
    new PublicKey(data.collectionId), 
    data.name, 
    data.symbol, 
    data.uri, 
    data.modelHash
  );

  // Get a recent blockhash
  const { blockhash } = await program.provider.connection.getLatestBlockhash('finalized');
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = program.provider.publicKey;

  return NextResponse.json({ 
    transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
    agentId: agentId.toString()
  });
}

async function handleInitializeTreasury(program: Program<NftGameAgentProgram>) {
  try {
    const result = await initializeTreasury(program);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error initializing treasury:", error);
    if ((error as Error).message.includes("already in use")) {
      return NextResponse.json({ message: "Treasury already initialized" });
    } else {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}

async function createCollectionTransaction(program: Program<Idl>, name: string, symbol: string, strategy: string) {
  const collectionId = web3.Keypair.generate().publicKey;
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  if (!program.provider.publicKey) {
    throw new Error("Provider public key is undefined");
  }

  const transaction = await program.methods.createCollection(name, symbol, strategy, collectionId)
    .accounts({
      collection: PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), collectionId.toBuffer()],
        program.programId
      )[0],
      authority: program.provider.publicKey,
      treasury: treasuryPDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .transaction();

  // Store collection data in Gun
  gun.get('collections').set({
    id: collectionId.toString(),
    name,
    symbol,
    strategy,
    createdAt: Date.now()
  });

  return { transaction, collectionId };
}

async function mintAIAgentTransaction(program: Program<Idl>, collectionId: PublicKey, name: string, symbol: string, uri: string, modelHash: number[]) {
  const id = web3.Keypair.generate().publicKey;
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  if (!program.provider.publicKey) {
    throw new Error("Provider public key is undefined");
  }

  const transaction = await program.methods.mintAIAgent(id, name, symbol, uri, modelHash, collectionId)
    .accounts({
      aiAgent: PublicKey.findProgramAddressSync(
        [Buffer.from("ai_agent"), id.toBuffer()],
        program.programId
      )[0],
      authority: program.provider.publicKey,
      payer: program.provider.publicKey,
      treasury: treasuryPDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .transaction();

  // Store AI agent data in Gun
  gun.get('agents').set({
    id: id.toString(),
    name,
    symbol,
    uri,
    modelHash: modelHash.join(','),
    collectionId: collectionId.toString(),
    mintedAt: Date.now()
  });

  return { transaction, agentId: id };
}

async function initializeTreasury(program: Program<NftGameAgentProgram>) {
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  await program.methods.initializeTreasury()
    .accounts({
      treasury: treasuryPDA,
      authority: program.provider.publicKey,
      systemProgram: web3.SystemProgram.programId,
    } as any)
    .rpc();

  return { message: "Treasury initialized successfully" };
}