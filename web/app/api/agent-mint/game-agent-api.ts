import { Program, web3 } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { NftGameAgentProgram } from '@casino-of-life-dashboard/anchor';

export async function initializeTreasury(program: Program<NftGameAgentProgram>) {
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  try {
    await program.methods.initializeTreasury()
      .accounts({
        treasury: treasuryPDA,
        authority: program.provider.publicKey,
        systemProgram: web3.SystemProgram.programId,
      } as any)
      .rpc();
    console.log("Treasury initialized successfully");
  } catch (error) {
    console.error("Error initializing treasury:", error);
    if ((error as Error).message.includes("already in use")) {
      console.log("Treasury already initialized");
    } else {
      throw error;
    }
  }
}

// Update existing createCollection function
export async function createCollection(program: Program, name: string, symbol: string, strategy: string) {
  const collectionId = web3.Keypair.generate().publicKey;
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  if (!program.provider.publicKey) {
    throw new Error("Provider public key is undefined");
  }

  return program.methods.createCollection(name, symbol, strategy, collectionId)
    .accounts({
      collection: PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), collectionId.toBuffer()],
        program.programId
      )[0],
      authority: program.provider.publicKey,
      treasury: treasuryPDA,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}

// Update existing mintAIAgent function
export async function mintAIAgent(program: Program, collectionId: PublicKey, name: string, symbol: string, uri: string, modelHash: number[]) {
  const id = web3.Keypair.generate().publicKey;
  const [treasuryPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  if (!program.provider.publicKey) {
    throw new Error("Provider public key is undefined");
  }

  return program.methods.mintAIAgent(id, name, symbol, uri, modelHash, collectionId)
    .accounts({
      aiAgent: PublicKey.findProgramAddressSync(
        [Buffer.from("ai_agent"), id.toBuffer()],
        program.programId
      )[0],
      authority: program.provider.publicKey,
      payer: program.provider.publicKey,
      treasury: treasuryPDA,
      // ... other existing accounts
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();
}