import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';
import { Provider } from '@reown/appkit-adapter-solana/react';
import { TokenType } from '../services/useSolana';

// Constants
const USER_BETTING_ACCOUNT_SEED = "user-bet-account"; // Use the same seed as in the program

export const mintDumbsForWin = async (
    programId: PublicKey,
    walletProvider: Provider,
    connection: Connection,
    activeFightSecureId: string,
    fightState: any
): Promise<string> => {
    console.log('Starting mintDumbsForWin function');
    console.log('BETTING_PROGRAM_ID:', programId.toBase58());
    console.log('Secure Fight ID:', activeFightSecureId);

    if (fightState.status !== 'completed' || !fightState.winner) {
        throw new Error('Fight must be completed with a winner to mint DUMBS');
    }
    
     // Check if user bet on the winning player
    const bets = fightState.bets;
    if ((fightState.winner === 'player1' && bets.player2 > 0) || 
        (fightState.winner === 'player2' && bets.player1 > 0)) {
        throw new Error('Cannot mint DUMBS - you did not bet on the winning player');
    }

    const wallet = {
        publicKey: new PublicKey(walletProvider.publicKey),
        signTransaction: async (tx: Transaction) => walletProvider.signTransaction(tx),
        signAllTransactions: async (txs: Transaction[]) =>
            Promise.all(txs.map(tx => walletProvider.signTransaction(tx)))
    };

  // Use the provided connection and walletProvider
    const provider = new AnchorProvider(connection, wallet as any, { preflightCommitment: 'processed' });
    const program = getBettingProgram(provider);
    const bettorPublicKey = new PublicKey(walletProvider.publicKey);

    // Derive PDAs
    const [dumbsMint] = PublicKey.findProgramAddressSync([Buffer.from("dumbs_mint")], program.programId);
    const raprMint = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");
    const [raprVault] = PublicKey.findProgramAddressSync([Buffer.from("rapr_vault")], program.programId);
    const [bettingState] = PublicKey.findProgramAddressSync([Buffer.from("betting_state")], program.programId);

    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);
    const userRaprAccount = await getAssociatedTokenAddress(raprMint, wallet.publicKey, false, TOKEN_2022_PROGRAM_ID);

     if (!activeFightSecureId || isNaN(Number(activeFightSecureId))) {
          throw new Error('Invalid activeFightSecureId format. Expected a number');
     }

    const numericFightId = new BN(activeFightSecureId);
     
     // Derive UserBettingAccount PDA
    const [userBettingAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from(USER_BETTING_ACCOUNT_SEED), bettorPublicKey.toBuffer()],
        program.programId
    );

     console.log("Derived userBettingAccount PDA:", userBettingAccount.toBase58());

    
    try {
        const transaction = new Transaction();

        // Add mint dumbs instruction
        const mintDumbsInstruction = await program.methods
            .mintDumbsForWin(numericFightId)
            .accounts({
                authority: wallet.publicKey,
                userBettingAccount, // Pass the userBettingAccount PDA
                bettor: wallet.publicKey,
                userDumbsAccount,
                userRaprAccount,
                raprVault,
                dumbsMint,
                bettingState,
                token2022Program: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            } as any)
            .instruction();
        transaction.add(mintDumbsInstruction);

        transaction.feePayer = wallet.publicKey;
        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;

        const signedTx = await wallet.signTransaction(transaction);
        const txid = await connection.sendRawTransaction(signedTx.serialize());

        // Confirm transaction using polling
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
              console.warn(`Mint DUMBS confirmation attempt ${attempts} failed:`, error);
                if (attempts === maxAttempts) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (!confirmed) {
            throw new Error('Mint DUMBS transaction confirmation timeout');
        }

         // After confirmation, check the userBettingAccount state
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
        console.error('Error in mintDumbsForWin:', error);
        throw error;
    }
};