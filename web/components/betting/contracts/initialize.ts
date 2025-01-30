import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { getBettingProgram } from '@casino-of-life-dashboard/anchor';

export const initializeIfNeeded = async (
    program: any,
    wallet: any,
) => {
    try {
        console.log('Starting initialization check...');
        console.log('Program ID:', program.programId.toString());
        console.log('Wallet public key:', wallet.publicKey.toString());

        const derivePDA = (seed: string | Buffer[], programId: PublicKey): PublicKey => {
            const seeds = Array.isArray(seed) ? seed : [Buffer.from(seed)];
            const [pda] = PublicKey.findProgramAddressSync(
                seeds,
                programId
            );
            return pda;
        };


        // Derive all PDAs using the helper function
        const bettingState = derivePDA([Buffer.from("betting_state"), wallet.publicKey.toBuffer()], program.programId);
        console.log('Betting state PDA:', bettingState.toString());

        const betVault = derivePDA("bet_vault", program.programId);
        console.log('Bet vault PDA:', betVault.toString());

        const solVault = derivePDA("sol_vault", program.programId);
        console.log('Sol vault PDA:', solVault.toString());

        const treasury = derivePDA("treasury", program.programId);
        console.log('Treasury PDA:', treasury.toString());

        const dumbsMint = derivePDA("dumbs_mint", program.programId);
        console.log('DUMBS mint PDA:', dumbsMint.toString());

        const raprMint = new PublicKey("RAPRz9fd87y9qcBGj1VVqUbbUM6DaBggSDA58zc3N2b");
        console.log('Using actual RAPR mint:', raprMint.toString());

        const [raprVault] = PublicKey.findProgramAddressSync(
            [Buffer.from("rapr_vault")],
            program.programId
        );
        console.log('RAPR vault PDA:', raprVault.toString());

         // Get user's DUMBS token account address
        const userDumbsAccount = await getAssociatedTokenAddress(
            dumbsMint,
            wallet.publicKey,
            true,
            TOKEN_2022_PROGRAM_ID
        );
        console.log('User DUMBS account address:', userDumbsAccount.toString());

        // Check if betting state exists
        console.log('Checking if betting state exists...');
        const bettingStateInfo = await program.provider.connection.getAccountInfo(bettingState);
         console.log('Betting state info:', bettingStateInfo ? 'exists' : 'does not exist');

        let initBettingStateBaseTxid : string;
         if (!bettingStateInfo) {
            console.log('Betting state not found, preparing initialization...');

            // Initialize betting state base first
            console.log('Sending initializeBettingStateBase instruction...');
            try {
              const initBettingStateBaseTx = await program.methods
                  .initializeBettingStateBase()
                 .accounts({
                        authority: wallet.publicKey,
                        bettingState,
                        systemProgram: SystemProgram.programId,
                    })
                   .transaction();

                   console.log('Transaction built, getting blockhash...');
                 const { blockhash } = await program.provider.connection.getLatestBlockhash();
                  initBettingStateBaseTx.recentBlockhash = blockhash;
                    initBettingStateBaseTx.feePayer = wallet.publicKey;

                   console.log('Signing transaction...');
                   const signedInitBettingStateBaseTx = await wallet.signTransaction(initBettingStateBaseTx);
                
                   console.log('Sending transaction...');
                   initBettingStateBaseTxid = await program.provider.connection.sendRawTransaction(signedInitBettingStateBaseTx.serialize());
                    console.log('Transaction sent:', initBettingStateBaseTxid);

                     console.log('Waiting for confirmation...');
                  await confirmTransaction(program.provider.connection, initBettingStateBaseTxid)
                     console.log('Initialize betting state base confirmation complete');
                }
               catch (error) {
                 console.error('Initialize betting state base failed with error:', error);
                    if (error instanceof Error) {
                        if ('logs' in error) {
                            console.error('Program error logs:', error.logs);
                        }
                        try {
                            const simulation = await program.provider.connection.simulateTransaction(initBettingStateBaseTxid);
                            console.error('Transaction simulation:', JSON.stringify(simulation, null, 2));
                        } catch (simError) {
                            console.error('Simulation failed:', simError);
                        }
                    }
                    throw error;
               }
           //  Initialize Dumbs Mint
           console.log('Sending initializeDumbsMint instruction...');
            let initDumbsMintTxid: string;
            let signedInitDumbsMintTx;
            try {
                const initDumbsMintTx = await program.methods
                    .initializeDumbsMint()
                     .accounts({
                        authority: wallet.publicKey,
                        dumbsMint,
                        bettingState,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                     })
                    .transaction();
                
                    console.log('Transaction built, getting blockhash...');
                    const { blockhash } = await program.provider.connection.getLatestBlockhash();
                    initDumbsMintTx.recentBlockhash = blockhash;
                     initDumbsMintTx.feePayer = wallet.publicKey;

                     console.log('Signing transaction...');
                     signedInitDumbsMintTx = await wallet.signTransaction(initDumbsMintTx);
                 
                     console.log('Sending transaction...');
                       initDumbsMintTxid = await program.provider.connection.sendRawTransaction(signedInitDumbsMintTx.serialize(), {
                          skipPreflight: true,
                           preflightCommitment: 'processed',
                        });
                    console.log('Transaction sent:', initDumbsMintTxid);
            
                     console.log('Waiting for confirmation...');
                    await confirmTransaction(program.provider.connection, initDumbsMintTxid);
                    console.log('Initialize DUMBS mint confirmation complete');

              } catch (error) {
                  console.error('Initialize DUMBS mint failed with error:', error);
                    if (error instanceof Error && 'logs' in error) {
                        try {
                           const simulation = await program.provider.connection.simulateTransaction(signedInitDumbsMintTx);
                            console.error('Detailed simulation:', JSON.stringify(simulation, null, 2));
                        } catch (simError) {
                             console.error('Failed to get simulation details:', simError);
                        }
                    }
                     throw error;
                }
            // Initialize state accounts
             console.log('Sending initializeStateAccounts instruction...');
           let initStateAccountsTxid :string;
            let signedInitStateAccountsTx;
           try {
             const initStateAccountsTx = await program.methods
                   .initializeStateAccounts()
                   .accounts({
                        authority: wallet.publicKey,
                        bettingState,
                        dumbsMint,
                        userTokenAccount: userDumbsAccount,
                        raprMint,
                        tokenProgram: TOKEN_2022_PROGRAM_ID,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                   })
                   .transaction();

                    console.log('Transaction built, getting blockhash...');
                    const { blockhash } = await program.provider.connection.getLatestBlockhash();
                    initStateAccountsTx.recentBlockhash = blockhash;
                      initStateAccountsTx.feePayer = wallet.publicKey;

                   console.log('Signing transaction...');
                    signedInitStateAccountsTx = await wallet.signTransaction(initStateAccountsTx);

                     console.log('Sending transaction...');
                    initStateAccountsTxid = await program.provider.connection.sendRawTransaction(signedInitStateAccountsTx.serialize());
                    console.log('Transaction sent:', initStateAccountsTxid);

                    console.log('Waiting for confirmation...');
                     await confirmTransaction(program.provider.connection, initStateAccountsTxid);
                    console.log('Initialize state accounts confirmation complete');

             } catch (error) {
                   console.error('Initialize State Accounts failed with error:', error);
                    if (error instanceof Error && 'logs' in error) {
                         try {
                             const simulation = await program.provider.connection.simulateTransaction(initStateAccountsTxid);
                               console.error('Detailed simulation:', JSON.stringify(simulation, null, 2));
                         } catch (simError) {
                            console.error('Failed to get simulation details:', simError);
                        }
                    }
                    throw error;
                }
             // Initialize the betting state with the rest of the accounts
             console.log('Sending initializeBettingState instruction...');
            let initBettingStateTxid: string;
              try {
                  const initBettingStateTx = await program.methods
                    .initializeBettingState()
                   .accounts({
                        authority: wallet.publicKey,
                        bettingState,
                        betVault,
                        raprVault,
                        treasury,
                        solVault,
                   })
                 .transaction();

                    console.log('Transaction built, getting blockhash...');
                    const { blockhash } = await program.provider.connection.getLatestBlockhash();
                    initBettingStateTx.recentBlockhash = blockhash;
                     initBettingStateTx.feePayer = wallet.publicKey;

                    console.log('Signing transaction...');
                   const signedInitBettingStateTx = await wallet.signTransaction(initBettingStateTx);

                    console.log('Sending transaction...');
                     initBettingStateTxid = await program.provider.connection.sendRawTransaction(signedInitBettingStateTx.serialize());
                     console.log('Transaction sent:', initBettingStateTxid);

                    console.log('Waiting for confirmation...');
                     await confirmTransaction(program.provider.connection, initBettingStateTxid);
                     console.log('Initialize betting state confirmation complete');
                 } catch (error) {
                      console.error('Initialize betting state failed with error:', error);
                       if (error instanceof Error && 'logs' in error) {
                            try {
                                const simulation = await program.provider.connection.simulateTransaction(initBettingStateTxid);
                                  console.error('Detailed simulation:', JSON.stringify(simulation, null, 2));
                             } catch (simError) {
                                 console.error('Failed to get simulation details:', simError);
                            }
                        }
                    throw error;
                }
        }

        // Initialize vaults
        const betVaultInfo = await program.provider.connection.getAccountInfo(betVault);
        if (!betVaultInfo) {
            console.log('Initializing bet vault...');
            await program.methods
                .initializeBetVault()
                .accounts({
                    authority: wallet.publicKey,
                    betVault,
                    dumbsMint,
                    bettingState,
                    tokenProgram: TOKEN_2022_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc();
            console.log('Bet vault initialized');
        }

        // Verify RAPR mint matches betting state
        const bettingStateAccount = await program.account.bettingState.fetch(bettingState);
         console.log('RAPR mint in betting state:', bettingStateAccount.raprMint.toString());
         console.log('RAPR mint being passed:', raprMint.toString());

        const raprVaultInfo = await program.provider.connection.getAccountInfo(raprVault);
        if (!raprVaultInfo) {
              console.log('Initializing RAPR vault...');
              try {
                await program.methods
                    .initializeRaprVault()
                    .accounts({
                        authority: wallet.publicKey,
                        raprVault,
                        raprMint,
                        bettingState,
                         tokenProgram: TOKEN_2022_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .rpc();
            } catch (error) {
                console.log('Full error logs:', error.logs);
                throw error;
            }
            console.log('RAPR vault initialized');
        }

        if (!bettingStateAccount.raprMint.equals(raprMint)) {
            throw new Error('RAPR mint mismatch');
        }

        const solVaultInfo = await program.provider.connection.getAccountInfo(solVault);
        if (!solVaultInfo) {
            console.log('Initializing SOL vault...');
            await program.methods
                .initializeSolVault()
                .accounts({
                    authority: wallet.publicKey,
                    solVault,
                     bettingState,
                    systemProgram: SystemProgram.programId,
                     rent: SYSVAR_RENT_PUBKEY,
                })
                 .rpc();
           console.log('SOL vault initialized');
        }

        // Initialize treasury
        const treasuryInfo = await program.provider.connection.getAccountInfo(treasury);
        if (!treasuryInfo) {
            console.log('Initializing treasury...');
            await program.methods
                .initializeTreasury()
                .accounts({
                    authority: wallet.publicKey,
                    treasury,
                     bettingState,
                     systemProgram: SystemProgram.programId,
                     rent: SYSVAR_RENT_PUBKEY,
                })
                 .rpc();
            console.log('Treasury initialized');
        }

         console.log('All initialization checks complete');
        return {
            bettingState,
            betVault,
            raprVault,
            solVault,
            treasury,
            dumbsMint,
            raprMint
         };
    } catch (error) {
        console.error('Initialization error:', error);
          if (error.logs) {
              console.error('Program logs:', error.logs);
          }
        throw error;
     }
};

const confirmTransaction = async (connection: any, txid: string) => {
    let confirmed = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!confirmed && attempts < maxAttempts) {
        try {
            const status = await connection.getSignatureStatus(txid);
            
            if (!status?.value) {
                console.log(`Attempt ${attempts + 1}/${maxAttempts}: Transaction not found`);
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }

            const { confirmationStatus, err } = status.value;

            if (err) {
                throw new Error(`Transaction failed: ${JSON.stringify(err)}`);
            }

            if (confirmationStatus === 'confirmed' || confirmationStatus === 'finalized') {
                confirmed = true;
                console.log(`Transaction confirmed with status: ${confirmationStatus}`);
                break;
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
    return;
}