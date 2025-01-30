import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction 
} from '@solana/spl-token';
import { 
  SystemProgram, 
  Transaction, 
  PublicKey, 
  Connection, 
  ComputeBudgetProgram 
} from '@solana/web3.js';
import { BN, AnchorProvider } from '@coral-xyz/anchor';
import { getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { initializeIfNeeded } from './initialize';

// Constants
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
const RAPR_MINT = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");

// Helper function to confirm transaction
async function confirmTransaction(connection: Connection, txid: string, latestBlockhash: any) {
  let confirmed = false;
  let attempts = 0;
  const maxAttempts = 3;

  while (!confirmed && attempts < maxAttempts) {
    try {
      const confirmation = await connection.confirmTransaction({
        signature: txid,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }
      
      confirmed = true;
    } catch (error) {
      attempts++;
      if (attempts === maxAttempts) {
        throw new Error('Failed to confirm transaction');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return confirmed;
}

// Function for swapping SOL to RAPR
export async function swapSolForRapr(
  programId: PublicKey,
  amount: number,
  wallet: any,
  connection: Connection
): Promise<string> {
  console.log('Starting swapSolForRapr');
  console.log('Amount:', amount, 'SOL');

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);

  // Get RAPR token account
  const userRaprAccount = await getAssociatedTokenAddress(
    RAPR_MINT,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Get DUMBS mint PDA for initialization
  const [dumbsMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("dumbs_mint")],
    programId
  );

  // Derive PDAs
  const [bettingState] = PublicKey.findProgramAddressSync(
    [Buffer.from("betting_state")],
    programId
  );

  const [solVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("sol_vault")],
    programId
  );

  try {
    const transaction = new Transaction();

    // Add compute budget
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 })
    );

    // Create RAPR token account if needed
    const tokenAccountInfo = await connection.getAccountInfo(userRaprAccount);
    if (!tokenAccountInfo) {
      console.log('Creating RAPR token account');
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userRaprAccount,
          wallet.publicKey,
          RAPR_MINT,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // Add RAPR swap instruction
    console.log('Adding RAPR swap instruction');
    const swapInstruction = await program.methods.swapSolForRapr(
      new BN(amount * 1e9)
    )
    .accountsStrict({
      user: wallet.publicKey,
      userRaprAccount,
      solVault,
      raprMint: RAPR_MINT,
      bettingState,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .instruction();
    
    transaction.add(swapInstruction);

    // Set transaction parameters
    transaction.feePayer = wallet.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    // Sign and send
    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());

    // Confirm
    await confirmTransaction(connection, txid, latestBlockhash);
    console.log('RAPR swap confirmed:', txid);
    return txid;
  } catch (error) {
    console.error('Error in swapSolForRapr:', error);
    throw error;
  }
}