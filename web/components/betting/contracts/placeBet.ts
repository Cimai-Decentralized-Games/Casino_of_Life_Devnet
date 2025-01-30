import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';
import { OddsCalculator } from '../services/odds-calculator';
import { useBalanceManager } from '../services/balance-manager';
import { Provider } from '@reown/appkit-adapter-solana/react';
import { TokenType } from '../services/useSolana';

// Constants
type AnchorTokenType = { dumbs: null } | { rapr: null };
const USER_BETTING_ACCOUNT_SEED = "user-bet-account"; // Use the same seed as in the program


export const placeBet = async (
  programId: PublicKey,
  fightId: string,
  betAmount: number,
  odds: number,
  tokenType: TokenType,
  walletProvider: Provider,
  connection: Connection,
  activeFightSecureId: string,
  onBalanceUpdate?: (balances: any) => void
): Promise<string> => {
  try {
    // 1. Initial Setup and Validation
    const numericFightId = new BN(fightId.split('-')[0]);
    const rawBetAmount = new BN(betAmount * 1e9);
    const bettorPublicKey = new PublicKey(walletProvider.publicKey);

    const wallet = {
      publicKey: bettorPublicKey,
      signTransaction: async (tx: Transaction) => walletProvider.signTransaction(tx),
      signAllTransactions: async (txs: Transaction[]) => 
        Promise.all(txs.map(tx => walletProvider.signTransaction(tx)))
    };

    // 2. Initialize Provider and Program
    const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: 'processed' });
    const program = getBettingProgram(provider);

    // 3. Derive PDAs and Accounts
    const [dumbsMint] = PublicKey.findProgramAddressSync([Buffer.from("dumbs_mint")], program.programId);
    const raprMint = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");
    const [betVaultDumbs] = PublicKey.findProgramAddressSync([Buffer.from("bet_vault")], program.programId);
    const [raprVault] = PublicKey.findProgramAddressSync([Buffer.from("rapr_vault")], program.programId);
    const [bettingState] = PublicKey.findProgramAddressSync([Buffer.from("betting_state")], program.programId);
    const [treasury] = PublicKey.findProgramAddressSync([Buffer.from("treasury")], program.programId);
    const [betVaultStats] = PublicKey.findProgramAddressSync([Buffer.from("bet_vault_stats")], program.programId);

     // Derive UserBettingAccount PDA
    const [userBettingAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from(USER_BETTING_ACCOUNT_SEED), bettorPublicKey.toBuffer()],
        program.programId
    );

    // 4. Get User Token Accounts
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const userRaprAccount = await getAssociatedTokenAddress(raprMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

    // 5. Balance Checks
    const userBalance = await connection.getTokenAccountBalance(userDumbsAccount);
    const freeBalance = Number(userBalance.value.amount) / 1e9;
    if (freeBalance < betAmount) {
      throw new Error(`Insufficient DUMBS balance. Required: ${betAmount}, Available: ${freeBalance}`);
    }
    
    console.log('=== User Betting Account Debug ===');
    console.log('PDA Components:');
    console.log('- Seed "user-bet-account":', Array.from(Buffer.from(USER_BETTING_ACCOUNT_SEED)));
    console.log('- Wallet:', wallet.publicKey.toString());
    console.log('Derived User Betting Account PDA:', userBettingAccount.toString());


    // 6. Prepare Transaction Parameters
    const bettingStateAccount = await program.account.bettingState.fetch(bettingState);
    const oddsCalculator = new OddsCalculator();
    const contractOdds = oddsCalculator.convertOddsToContractFormat(odds);
    const anchorTokenType: AnchorTokenType = tokenType === TokenType.DUMBS ? { dumbs: null } : { rapr: null };

    // 7. Build Transaction
    const transaction = new Transaction();
   
    const betInstruction = await program.methods
      .placeBet(rawBetAmount, numericFightId, new BN(contractOdds), anchorTokenType)
      .accounts({
        bettor: wallet.publicKey,
        userBettingAccount, // Pass the userBettingAccount PDA
        userDumbsAccount,
        userRaprAccount,
        betVaultDumbs,
        betVaultRapr: raprVault,
        treasury: bettingStateAccount.treasury,
        dumbsMint,
        betVaultStats,
        bettingState,
        token2022Program: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      } as any)
      .instruction();

     console.log('=== Transaction Instructions ===');
     console.log('1. Adding Place Bet Instruction');
     transaction.add(betInstruction);


    // 8. Send and Confirm Transaction
    transaction.feePayer = wallet.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    const signedTx = await wallet.signTransaction(transaction);
    const txid = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // 9. Confirm Transaction
     let confirmed = false;
     let attempts = 0;
      const maxAttempts = 3;

    while (!confirmed && attempts < maxAttempts) {
      try {
        const status = await connection.getSignatureStatus(txid);
        if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
          if (!status.value?.err) {
             confirmed = true;
             break;
           }
        }
        attempts++;
         await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn(`Confirmation attempt ${attempts} failed:`, error);
         if (attempts === maxAttempts) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!confirmed) {
      throw new Error('Transaction confirmation timeout');
    }

    // 10. Update Balances (if callback provided)
    if (onBalanceUpdate) {
      try {
        const userDumbsBalance = await connection.getTokenAccountBalance(userDumbsAccount);
        const freeDumbsBalance = Number(userDumbsBalance.value.amount) / 1e9;
        onBalanceUpdate({
          freeDumbs: freeDumbsBalance,
          bet: betAmount,
          totalDumbs: freeDumbsBalance,
          fightId,
          secureFightId: activeFightSecureId
        });
      } catch (balanceError) {
        console.warn('Failed to update balances:', balanceError);
      }
    }


    // After confirmation, check the account state
    const userBettingAccountInfo = await connection.getAccountInfo(userBettingAccount);
     console.log('=== Post-Transaction User Betting Account ===');
     console.log('User Betting Account After:', {
          exists: userBettingAccountInfo !== null,
          owner: userBettingAccountInfo?.owner?.toString(),
          size: userBettingAccountInfo?.data.length,
          data: userBettingAccountInfo?.data
    });

        try {
            const userBettingAccountData = await program.account.userBettingAccount.fetch(userBettingAccount);
            console.log('User Betting Account Data:', {
                owner: userBettingAccountData.owner.toString(),
                totalBetsPlaced: userBettingAccountData.totalBetsPlaced.toString(),
                totalDumbsWagered: userBettingAccountData.totalDumbsWagered.toString(),
                totalRaprWagered: userBettingAccountData.totalRaprWagered.toString(),
                totalWinnings: userBettingAccountData.totalWinnings.toString(),
                lastBetTimestamp: userBettingAccountData.lastBetTimestamp.toString(),
            });
        } catch (e) {
            console.error('Failed to deserialize user betting account:', e);
         }

    return txid;
  } catch (error) {
    console.error('Error in placeBet:', error);
    throw error;
  }
};