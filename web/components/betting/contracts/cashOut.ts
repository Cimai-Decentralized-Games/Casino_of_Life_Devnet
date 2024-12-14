import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddress, 
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';

export const cashOut = async (
  connection: Connection,
  wallet: { publicKey: PublicKey; signTransaction: (tx: any) => Promise<any> },
  activeFightSecureId: string,
  fightState: any
): Promise<string> => {
  console.log('Starting cashOut process for fight:', activeFightSecureId);
  
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

  const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: 'confirmed' });
  const program = getBettingProgram(provider);
  const programId = program.programId;

  const secureFightIdBuffer = Buffer.alloc(8);
  secureFightIdBuffer.writeBigUInt64LE(BigInt(activeFightSecureId));
  
  // Get PDAs
  const [bettingStatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('betting_state')],
    programId
  );
  const [betVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet_vault"), bettingStatePDA.toBuffer()],
    programId
  );
  const [dumbsMint] = PublicKey.findProgramAddressSync(
    [Buffer.from('dumbs_mint')],
    programId
  );
  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from('treasury')],
    programId
  );
  const [dumbsTreasury] = PublicKey.findProgramAddressSync(
    [Buffer.from('dumbs_treasury')],
    programId
  );
  const [solVault] = PublicKey.findProgramAddressSync(
    [Buffer.from('sol_vault')],
    programId
  );
  const [bet] = PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), wallet.publicKey.toBuffer(), secureFightIdBuffer],
    programId
  );

  try {
    // Get token accounts
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey);
    const treasuryDumbsAccount = await getAssociatedTokenAddress(dumbsMint, dumbsTreasury, true);
    
    console.log('Account addresses:', {
      bet: bet.toString(),
      userDumbsAccount: userDumbsAccount.toString(),
      treasuryDumbsAccount: treasuryDumbsAccount.toString(),
      dumbsTreasury: dumbsTreasury.toString()
    });

    // Verify bet account
    const betAccount = await program.account.bet.fetch(bet);
    console.log('Bet account state:', {
      amount: betAccount.amount.toString(),
      odds: betAccount.odds.toString(),
      settled: betAccount.settled,
      bettor: betAccount.bettor.toString(),
      fightId: betAccount.fightId.toString()
    });

    // Check if bet needs to be settled first
    if (!betAccount.settled) {
      console.log('Bet not settled, initiating settlement...');
      const settleTx = await program.methods
        .settleBet(
          new BN(secureFightIdBuffer.readBigUInt64LE(0).toString()),
          wallet.publicKey
        )
        .accounts({
          authority: wallet.publicKey,
          betVault: betVault,
          solVault: solVault,
          bet: bet,
          bettorDumbsAccount: userDumbsAccount,
          dumbsMint: dumbsMint,
          bettingState: bettingStatePDA,
          treasury: treasury,
          dumbsTreasury: dumbsTreasury,
          treasuryDumbsAccount: treasuryDumbsAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await connection.confirmTransaction(settleTx, 'confirmed');
      console.log('Bet settled successfully:', settleTx);

      // Verify settlement
      const settledBet = await program.account.bet.fetch(bet);
      if (!settledBet.settled) {
        throw new Error('Bet settlement failed verification');
      }
    }

    // Get current balances
    const userBalance = await connection.getTokenAccountBalance(userDumbsAccount);
    const treasuryBalance = await connection.getTokenAccountBalance(treasuryDumbsAccount);
    console.log('Pre-cashout balances:', {
      user: userBalance.value.amount,
      treasury: treasuryBalance.value.amount
    });

    // Execute cashout
    console.log('Executing cashout...');
    const cashOutTx = await program.methods
      .cashOut(new BN(secureFightIdBuffer.readBigUInt64LE(0).toString()))
      .accounts({
        user: wallet.publicKey,
        userDumbsAccount: userDumbsAccount,
        bet: bet,
        betVault: betVault,
        solVault: solVault,
        dumbsMint: dumbsMint,
        bettingState: bettingStatePDA,
        treasury: treasury,
        dumbsTreasury: dumbsTreasury,
        treasuryDumbsAccount: treasuryDumbsAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();

    await connection.confirmTransaction(cashOutTx, 'confirmed');
    
    // Verify final balances
    const finalUserBalance = await connection.getTokenAccountBalance(userDumbsAccount);
    const finalTreasuryBalance = await connection.getTokenAccountBalance(treasuryDumbsAccount);
    
    console.log('Final balances:', {
      user: finalUserBalance.value.amount,
      treasury: finalTreasuryBalance.value.amount,
      transaction: cashOutTx
    });

    return cashOutTx;

  } catch (error) {
    console.error('Error in cashOut process:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        logs: 'logs' in error ? (error as any).logs : undefined
      });
      
      if ('logs' in error) {
        const logs = (error as any).logs;
        if (logs.some((log: string) => log.includes('InsufficientFunds'))) {
          throw new Error('Insufficient funds in treasury for payout');
        } else if (logs.some((log: string) => log.includes('AlreadySettled'))) {
          throw new Error('Bet has already been settled');
        } else if (logs.some((log: string) => log.includes('InvalidBetState'))) {
          throw new Error('Bet is in an invalid state for cashout');
        } else if (logs.some((log: string) => log.includes('ConstraintTokenOwner'))) {
          throw new Error('Treasury account ownership constraint violated');
        }
      }
      throw error;
    }
    throw error;
  }
};