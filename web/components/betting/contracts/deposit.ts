import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { SystemProgram, Transaction, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { BN, AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, ComputeBudgetProgram } from '@solana/web3.js';
import { getBettingProgram, BETTING_PROGRAM_ID } from '@casino-of-life-dashboard/anchor';
import { BettingProgram } from '@casino-of-life-dashboard/anchor';

async function initializeDumbsMint(
  program: Program<BettingProgram>,
  authority: PublicKey,
  bettingState: PublicKey,
  dumbsMint: PublicKey
): Promise<void> {
  const accountInfo = await program.provider.connection.getAccountInfo(dumbsMint);
  
  if (!accountInfo) {
    console.log("Initializing DUMBS mint");
    await program.methods
      .initializeDumbsMint()
      .accounts({
        authority,
        dumbsMint,
        bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .rpc();
  } else {
    console.log("DUMBS mint already initialized");
  }
}

// Add this new function to initialize the SOL vault
async function initializeSolVault(
  program: Program<BettingProgram>,
  authority: PublicKey,
  solVault: PublicKey,
  bettingState: PublicKey
): Promise<void> {
  const solVaultInfo = await program.provider.connection.getAccountInfo(solVault);
  
  if (!solVaultInfo) {
    console.log("Initializing SOL vault");
    await program.methods
      .initializeSolVault()
      .accounts({
        authority,
        solVault,
        bettingState,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log("SOL vault initialized");
  } else {
    console.log("SOL vault already initialized");
  }
}

// Add this new function to initialize the treasury
async function initializeTreasury(
  program: Program<BettingProgram>,
  authority: PublicKey,
  treasury: PublicKey
): Promise<void> {
  const treasuryInfo = await program.provider.connection.getAccountInfo(treasury);
  
  if (!treasuryInfo) {
    console.log("Initializing treasury");
    await program.methods
      .initializeTreasury()
      .accounts({
        authority,
        treasury,
        systemProgram: SystemProgram.programId,
      } as any)
      .rpc();
    console.log("Treasury initialized");
  } else {
    console.log("Treasury already initialized");
  }
}

export async function depositSol(
  programId: PublicKey,
  amount: number,
  wallet: any,
  connection: Connection
): Promise<string> {
  console.log('Starting depositSol function');
  console.log("Using Program ID:", programId.toBase58());
  console.log('BETTING_PROGRAM_ID:', BETTING_PROGRAM_ID.toBase58());

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);

  // Generate PDAs for bettingState, solVault, dumbsMint, and treasury
  const [bettingState] = PublicKey.findProgramAddressSync(
    [Buffer.from("betting_state")],
    programId
  );
  const [solVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("sol_vault")],
    programId
  );
  const [dumbsMint] = PublicKey.findProgramAddressSync(
    [Buffer.from("dumbs_mint")],
    programId
  );
  const [treasury] = PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    programId
  );

  console.log('Betting State:', bettingState.toBase58());
  console.log('SOL Vault:', solVault.toBase58());
  console.log('DUMBS Mint:', dumbsMint.toBase58());
  console.log('Treasury:', treasury.toBase58());

  try {
    // Check if betting state account exists
    const bettingStateAccountInfo = await connection.getAccountInfo(bettingState);

    if (!bettingStateAccountInfo) {
      console.log("Initializing betting state");
      await program.methods
        .initialize({
          exchangeRate: new BN(10000), // Example value, adjust as needed
          minDeposit: new BN(100000000), // 0.1 SOL in lamports
          maxBet: new BN(1000000000), // 1 SOL in lamports
          houseFee: new BN(250), // 2.5%
          depositFee: new BN(0),
          cashoutFee: new BN(0)
        })
        .accounts({
          authority: wallet.publicKey,
          bettingState: bettingState,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();
      console.log("Betting state initialized");
    } else {
      console.log("Betting state already initialized");
    }

    // Initialize DUMBS mint if it doesn't exist
    await initializeDumbsMint(program, wallet.publicKey, bettingState, dumbsMint);

    // Initialize SOL vault if it doesn't exist
    await initializeSolVault(program, wallet.publicKey, solVault, bettingState);

    // Initialize treasury if it doesn't exist
    await initializeTreasury(program, wallet.publicKey, treasury);

    // Fetch BettingState to get current parameters
    console.log('Fetching BettingState account');
    const bettingStateData = await program.account.bettingState.fetch(bettingState);

    // Check minimum deposit
    if (amount * 1e9 < bettingStateData.minDeposit.toNumber()) {
      throw new Error(`Deposit amount too small. Minimum deposit is ${bettingStateData.minDeposit.toNumber() / 1e9} SOL`);
    }

    // Calculate expected DUMBS tokens
    const expectedDumbs = (amount * 1e9 * bettingStateData.exchangeRate.toNumber()) / 1e4;
    console.log(`Depositing ${amount} SOL, expected to receive ${expectedDumbs / 1e9} DUMBS tokens`);

    // Get user's DUMBS token account
    console.log('Getting user DUMBS token account');
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey);
    console.log('User DUMBS Account:', userDumbsAccount.toBase58());

    console.log('Creating transaction');
    const transaction = new Transaction();

    // Add ComputeBudget instruction
    console.log('Adding ComputeBudget instruction');
    const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 });
    transaction.add(computeBudgetInstruction);

    // Check if the user's DUMBS token account exists
    console.log('Checking if user DUMBS token account exists');
    const userDumbsAccountInfo = await connection.getAccountInfo(userDumbsAccount);
    if (!userDumbsAccountInfo) {
      console.log("Creating user's DUMBS token account");
      transaction.add(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          userDumbsAccount,
          wallet.publicKey,
          dumbsMint,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    } else {
      console.log("User's DUMBS token account already exists");
    }

    console.log('Adding deposit instruction');
    const depositInstruction = await program.methods
      .depositSol(new BN(amount * 1e9)) // Convert SOL to lamports
      .accounts({
        depositor: wallet.publicKey,
        solVault: solVault,
        dumbsMint: dumbsMint,
        userDumbsAccount: userDumbsAccount,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .instruction();
    
    transaction.add(depositInstruction);

    console.log('Setting transaction fee payer and recent blockhash');
    transaction.feePayer = wallet.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    transaction.recentBlockhash = latestBlockhash.blockhash;

    console.log('Signing transaction');
    const signedTx = await wallet.signTransaction(transaction);

    console.log('Sending transaction');
    const txid = await connection.sendRawTransaction(signedTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    console.log('Transaction sent:', txid);

    console.log('Confirming transaction');
    const confirmation = await connection.confirmTransaction(txid, 'confirmed');

    if (confirmation.value.err) {
      console.error('Transaction failed:', confirmation.value.err);
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

    console.log('Transaction confirmed:', txid);
    console.log(`Successfully deposited ${amount} SOL and received approximately ${expectedDumbs / 1e9} DUMBS tokens`);
    return txid;
  } catch (error) {
    console.error('Error in depositSol:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if ('logs' in error) {
        console.error('Error logs:', (error as any).logs);
      }
    }
    throw error;
  }
}