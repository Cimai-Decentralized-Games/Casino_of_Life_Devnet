import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';
import { Provider } from '@reown/appkit-adapter-solana/react';
import { useBalanceManager } from '../services/balance-manager';


export const cashOut = async (
  programId: PublicKey,
  fightId: string,
  walletProvider: Provider,
  connection: Connection,
  activeFightSecureId: string,
  fightState: any,
  onBalanceUpdate?: (balances: any) => void,
  updateBalancesForFight?: (fightId: string) => Promise<void>
): Promise<string> => {
  console.log('Starting cashOut function');
  console.log('BETTING_PROGRAM_ID:', programId.toBase58());
  console.log('Fight ID:', fightId);
  console.log('Secure Fight ID:', activeFightSecureId);

  // Verify fight is completed and has a winner
  if (fightState.status !== 'completed') {
    throw new Error('Fight must be completed before cashing out');
  }

  if (!fightState.winner) {
    throw new Error('No winner declared for this fight');
  }

  // Check if user bet on the winning player
  const bets = fightState.bets;
  if ((fightState.winner === 'player1' && bets.player2 > 0) || 
      (fightState.winner === 'player2' && bets.player1 > 0)) {
    throw new Error('Cannot cash out - you did not bet on the winning player');
  }

  const wallet = {
    publicKey: new PublicKey(walletProvider.publicKey),
    signTransaction: async (tx: Transaction) => walletProvider.signTransaction(tx),
    signAllTransactions: async (txs: Transaction[]) => 
      Promise.all(txs.map(tx => walletProvider.signTransaction(tx)))
  };

  const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);

  // Derive PDAs
  const [bettingState] = PublicKey.findProgramAddressSync(
    [Buffer.from("betting_state")],
    program.programId
  );

  const [betVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet_vault")],
    program.programId
  );

  const [raprVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("rapr_vault")],
    program.programId
  );

  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    program.programId
  );

  const [solVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("sol_vault")],
    program.programId
  );

  // Get token accounts
  const [dumbsMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("dumbs_mint")],
    program.programId
  );
  const raprMint = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");
  
  const userDumbsAccount = await getAssociatedTokenAddress(
    dumbsMint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );
  
  const userRaprAccount = await getAssociatedTokenAddress(
    raprMint,
    wallet.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Create bet PDA
  const secureFightIdBuffer = Buffer.alloc(8);
  secureFightIdBuffer.writeBigUInt64LE(BigInt(activeFightSecureId));
  const [bet] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), wallet.publicKey.toBuffer(), secureFightIdBuffer],
    program.programId
  );

  try {
    const transaction = new Transaction();

    // Add settle instruction
    const settleInstruction = await program.methods
      .settleBet(
        new BN(secureFightIdBuffer.readBigUInt64LE(0).toString()),
        new PublicKey(fightState.winner)
      )
      .accounts({
        authority: wallet.publicKey,
        bet,
        bettor: wallet.publicKey,
        userDumbsAccount,
        userRaprAccount,
        betVault,
        betVaultRapr: raprVault,
        betVaultDumbs: betVault,
        treasury,
        bettingState,
        dumbsMint,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();

    transaction.add(settleInstruction);

    transaction.feePayer = wallet.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize());

    // Confirm transaction
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

    // Update balances
    if (onBalanceUpdate && updateBalancesForFight) {
      await updateBalancesForFight(activeFightSecureId);
    }

    return txid;
  } catch (error) {
    console.error('Error in cashOut:', error);
    throw error;
  }
};