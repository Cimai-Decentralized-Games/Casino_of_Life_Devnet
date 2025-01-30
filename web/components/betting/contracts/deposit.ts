import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, Transaction, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { BN, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, ComputeBudgetProgram } from '@solana/web3.js';
import { getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Provider } from '@reown/appkit-adapter-solana/react';
import { initializeIfNeeded } from './initialize';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export async function depositSol(
  programId: PublicKey,
  amount: number,
  walletProvider: Provider,
  connection: Connection
): Promise<string> {
  if (!walletProvider.publicKey) {
    throw new Error('Wallet not connected');
  }

  const wallet = {
    publicKey: new PublicKey(walletProvider.publicKey),
    signTransaction: async (tx: Transaction) => walletProvider.signTransaction(tx),
    signAllTransactions: async (txs: Transaction[]) => 
      Promise.all(txs.map(tx => walletProvider.signTransaction(tx)))
  };

  const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);
  const lamports = Math.round(amount * LAMPORTS_PER_SOL);

  try {
    console.log('Program ID:', programId.toBase58());
    console.log('Token Program:', TOKEN_2022_PROGRAM_ID.toBase58());
    console.log('Associated Token Program:', ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    console.log('Wallet pubkey:', wallet.publicKey.toBase58());

    // Get PDAs and ensure everything is initialized
    const { 
      betVault, 
      solVault, 
      treasury, 
      dumbsMint,
      bettingState 
    } = await initializeIfNeeded(program, wallet);

    // Get user's DUMBS token account
    const userDumbsAccount = await getAssociatedTokenAddress(
      dumbsMint,
      wallet.publicKey,
      true,
      TOKEN_2022_PROGRAM_ID
    );
    console.log('User DUMBS account address:', userDumbsAccount.toBase58());
    console.log('DUMBS mint address:', dumbsMint.toBase58());

    // Create deposit transaction
    console.log('Creating deposit transaction...');
    const transaction = new Transaction();

    // Add compute budget
    transaction.add(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000,
      })
    );

    // Add deposit instruction
    const depositIx = await program.methods
      .depositSol(new BN(lamports))
      .accounts({
        depositor: wallet.publicKey,
        userDumbsAccount,
        solVault,
        betVaultDumbs: betVault,
        dumbsMint,
        bettingState,
        treasury,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .instruction();

    transaction.add(depositIx);

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    console.log('Signing transaction...');
    const signed = await wallet.signTransaction(transaction);
    
    console.log('Sending transaction...');
    const txid = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    
    console.log('Confirming transaction...');
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!confirmed && attempts < maxAttempts) {
      try {
        const status = await connection.getSignatureStatus(txid);
        if (status.value?.confirmationStatus === 'confirmed' || 
            status.value?.confirmationStatus === 'finalized') {
          if (!status.value?.err) {
            confirmed = true;
            break;
          }
        }
        attempts++;
        if (!confirmed && attempts === maxAttempts) {
          const finalStatus = await connection.getSignatureStatus(txid);
          if (finalStatus.value?.confirmationStatus === 'confirmed' || 
              finalStatus.value?.confirmationStatus === 'finalized') {
            if (!finalStatus.value?.err) {
              confirmed = true;
            } else {
              throw new Error(`Transaction failed: ${JSON.stringify(finalStatus.value.err)}`);
            }
          }
        }
        if (!confirmed) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.warn(`Confirmation attempt ${attempts} failed:`, error);
        if (attempts === maxAttempts) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }

    console.log('Deposit transaction complete:', txid);
    return txid;
  } catch (error) {
    console.error('Detailed error:', {
      name: error.name,
      message: error.message,
      logs: error?.logs,
      error: error,
    });
    throw error;
  }
}