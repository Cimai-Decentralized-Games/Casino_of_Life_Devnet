import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { AnchorProvider, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';

const MIN_BET_DUMBS = 1;

function generateSecureFightId(): bigint {
  const timestamp = BigInt(Date.now());
  const randomBytes = new Uint8Array(4);
  crypto.getRandomValues(randomBytes);
  const randomNumber = BigInt(new DataView(randomBytes.buffer).getUint32(0));
  return (timestamp << 16n) | (randomNumber & 0xFFFFn);
}

export const placeBet = async (
  programId: PublicKey,
  originalFightId: string,
  betAmount: number,
  odds: number,
  wallet: any,
  connection: Connection
): Promise<string> => {
  console.log('Starting placeBet function');
  console.log('BETTING_PROGRAM_ID:', programId.toBase58());
  console.log('Original Fight ID:', originalFightId);
  console.log('Bet Amount:', betAmount);
  console.log('Odds:', odds);

  const secureFightId = generateSecureFightId();
  console.log('Generated Secure Fight ID:', secureFightId.toString());

  const betAmountLamports = Math.floor(betAmount * 1e9);
  console.log('Bet Amount in lamports:', betAmountLamports);

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);
  console.log('Program ID:', program.programId.toBase58());

  const [bettingState] = PublicKey.findProgramAddressSync(
    [Buffer.from("betting_state")],
    program.programId
  );
  const [betVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet_vault"), bettingState.toBuffer()],
    program.programId
  );
  const [dumbsMint] = PublicKey.findProgramAddressSync([Buffer.from('dumbs_mint')], programId);
  const [treasury] = PublicKey.findProgramAddressSync([Buffer.from('treasury')], programId);
  const [dumbsTreasury] = PublicKey.findProgramAddressSync([Buffer.from('dumbs_treasury')], programId);
  const dumbsTreasuryAccount = await getAssociatedTokenAddress(dumbsMint, dumbsTreasury, true);

  console.log('Betting State PDA:', bettingState.toBase58());
  console.log('Derived Bet Vault PDA:', betVault.toBase58());
  console.log('DUMBS Mint PDA:', dumbsMint.toBase58());
  console.log('Treasury PDA:', treasury.toBase58());
  console.log('DUMBS Treasury PDA:', dumbsTreasury.toBase58());
  console.log('DUMBS Treasury Account:', dumbsTreasuryAccount.toBase58());

  console.log('Wallet public key:', wallet.publicKey.toBase58());
  
  const secureFightIdBuffer = Buffer.alloc(8);
  secureFightIdBuffer.writeBigUInt64LE(secureFightId);

  const [bet] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), wallet.publicKey.toBuffer(), secureFightIdBuffer],
    program.programId
  );
  console.log('Derived Bet PDA:', bet.toBase58());

  try {
    console.log('Fetching Betting State Data...');
    const bettingStateData = await program.account.bettingState.fetch(bettingState);
    console.log('Fetched Betting State Data:', bettingStateData);

    // Check if bet vault is initialized
    const betVaultAccount = await connection.getAccountInfo(betVault);
    if (!betVaultAccount) {
      console.log('Bet vault not initialized. Initializing...');
      await program.methods
        .initializeBetVault()
        .accounts({
          authority: wallet.publicKey,
          betVault: betVault,
          dumbsMint: dumbsMint,
          bettingState: bettingState,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();
      console.log('Bet vault initialized successfully');
    }

    // Check if DUMBS treasury is initialized
    const dumbsTreasuryInfo = await connection.getAccountInfo(dumbsTreasury);
    if (!dumbsTreasuryInfo) {
      console.log('DUMBS treasury not initialized. Initializing...');
      await program.methods
        .initializeDumbsTreasury()
        .accounts({
          authority: wallet.publicKey,
          dumbsTreasury: dumbsTreasury,
          dumbsTreasuryAccount: dumbsTreasuryAccount,
          dumbsMint: dumbsMint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .rpc();
      console.log('DUMBS treasury initialized successfully');
    }

    // Check if DUMBS treasury account is initialized
    const dumbsTreasuryAccountInfo = await connection.getAccountInfo(dumbsTreasuryAccount);
    if (!dumbsTreasuryAccountInfo) {
      console.log('DUMBS treasury account not initialized. Initializing...');
      try {
        await program.methods
          .initializeDumbsTreasury()
          .accounts({
            authority: wallet.publicKey,
            dumbsTreasury: dumbsTreasury,
            dumbsTreasuryAccount: dumbsTreasuryAccount,
            dumbsMint: dumbsMint,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
          } as any)
          .rpc();
        console.log('DUMBS treasury account initialized successfully');
      } catch (initError) {
        console.error('Error initializing DUMBS treasury account:', initError);
        throw new Error('Failed to initialize DUMBS treasury account');
      }
    } else {
      console.log('DUMBS treasury account already initialized');
    }

    console.log('Deriving User DUMBS Account...');
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey);
    console.log('Derived User DUMBS Account:', userDumbsAccount.toBase58());
    
    console.log('Fetching User DUMBS Balance...');
    const userDumbsBalance = await connection.getTokenAccountBalance(userDumbsAccount);
    console.log('User DUMBS Balance:', userDumbsBalance.value.uiAmount);

    if (Number(userDumbsBalance.value.amount) < betAmountLamports) {
      throw new Error(`Insufficient balance. You have ${Number(userDumbsBalance.value.amount) / 1e9} DUMBS, but tried to bet ${betAmountLamports / 1e9} DUMBS`);
    }

    // Fetch and log DUMBS treasury account info
    console.log('DUMBS Treasury Account Info:', dumbsTreasuryInfo);

    // Fetch and log DUMBS treasury token account info
    const dumbsTreasuryTokenInfo = await connection.getTokenAccountBalance(dumbsTreasuryAccount);
    console.log('DUMBS Treasury Token Account Info:', dumbsTreasuryTokenInfo);

    // Calculate and log the fee amount
    const feeAmount = Math.floor(betAmountLamports * bettingStateData.houseFee / 10000);
    console.log('Fee Amount:', feeAmount);

    console.log('Preparing to call program.methods.placeBet');
    console.log('Accounts being used:');
    console.log('- Bettor:', wallet.publicKey.toBase58());
    console.log('- User DUMBS Account:', userDumbsAccount.toBase58());
    console.log('- Bet Vault:', betVault.toBase58());
    console.log('- Treasury:', treasury.toBase58());
    console.log('- DUMBS Treasury:', dumbsTreasury.toBase58());
    console.log('- DUMBS Treasury Account:', dumbsTreasuryAccount.toBase58());
    console.log('- Bet:', bet.toBase58());
    console.log('- Betting State:', bettingState.toBase58());
    console.log('- DUMBS Mint:', dumbsMint.toBase58());

    console.log('Calling program.methods.placeBet...');
    const tx = await program.methods
      .placeBet(new BN(betAmountLamports), new BN(secureFightId.toString()), new BN(Math.floor(odds * 100)))
      .accounts({
        bettor: wallet.publicKey,
        userDumbsAccount: userDumbsAccount,
        betVault: betVault,
        treasury: treasury,
        dumbsTreasury: dumbsTreasury,
        dumbsTreasuryAccount: dumbsTreasuryAccount,
        bet: bet,
        bettingState: bettingState,
        dumbsMint: dumbsMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .rpc();

    console.log('Bet placed successfully. Transaction ID:', tx);
    return tx;
  } catch (error) {
    console.error('Error in placeBet:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if ('logs' in error) {
        console.error('Error logs:', (error as any).logs);
      }
    }
    throw error;
  }
};