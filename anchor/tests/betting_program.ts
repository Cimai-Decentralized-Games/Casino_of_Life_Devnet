import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram, PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BettingProgram } from '../target/types/betting_program.js';
import { expect } from "chai";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from 'fs';

describe("betting_program", () => {
  console.log('Starting test setup...');

  // Configure the client to use the devnet cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  console.log('Provider:', provider);
  console.log('Provider wallet:', provider.wallet.publicKey.toString());

  const programId = new PublicKey("Hmci6T7LqMjpGTFQntH4JTgTZD73pfrt3e2hfHgZXfQm");
  console.log('Program ID:', programId.toString());

  const program = anchor.workspace.BettingProgram as Program<BettingProgram>;

  let authority: Keypair;
  let user1: Keypair;
  let user2: Keypair;
  let bettingState: PublicKey;
  let solVault: PublicKey;
  let dumbsMint: PublicKey;
  let betVault: PublicKey;

  before(async () => {
    console.log('Generating keypairs...');
    // Generate keypairs instead of loading from files
    authority = Keypair.generate();
    user1 = Keypair.generate();
    user2 = Keypair.generate();

    // Log public keys
    console.log('Authority public key:', authority.publicKey.toString());
    console.log('User1 public key:', user1.publicKey.toString());
    console.log('User2 public key:', user2.publicKey.toString());

    console.log('Deriving PDAs...');
    // Derive PDAs
    [bettingState] = await PublicKey.findProgramAddressSync(
      [Buffer.from("betting_state")],
      programId
    );
    [solVault] = await PublicKey.findProgramAddressSync(
      [Buffer.from("sol_vault")],
      programId
    );
    [dumbsMint] = await PublicKey.findProgramAddressSync(
      [Buffer.from("dumbs_mint")],
      programId
    );
    [betVault] = await PublicKey.findProgramAddressSync(
      [Buffer.from("bet_vault")],
      programId
    );

    // Save important public keys
    const accountInfo = {
      bettingState: bettingState.toBase58(),
      solVault: solVault.toBase58(),
      dumbsMint: dumbsMint.toBase58(),
      betVault: betVault.toBase58(),
      authority: authority.publicKey.toBase58(),
      user1: user1.publicKey.toBase58(),
      user2: user2.publicKey.toBase58(),
    };

    fs.writeFileSync('account-info.json', JSON.stringify(accountInfo, null, 2));

    console.log('Account info saved to account-info.json');
  });

  it("Initializes the betting program", async () => {
    console.log('Running initialization test...');
    const initializeParams = {
      exchangeRate: new anchor.BN(1000), // 1 SOL = 1000 DUMBS
      minDeposit: new anchor.BN(0.1 * LAMPORTS_PER_SOL),
      maxBet: new anchor.BN(1 * LAMPORTS_PER_SOL),
      houseFee: new anchor.BN(25), // 2.5%
      depositFee: new anchor.BN(10), // 1%
      cashoutFee: new anchor.BN(10), // 1%
    };

    await program.methods
      .initialize(initializeParams)
      .accounts({
        authority: authority.publicKey,
        bettingState: bettingState,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([authority])
      .rpc();

    const bettingStateAccount = await program.account.bettingState.fetch(bettingState) as any;
    expect(bettingStateAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(bettingStateAccount.exchangeRate.toNumber()).to.equal(initializeParams.exchangeRate.toNumber());
    expect(bettingStateAccount.minDeposit.toNumber()).to.equal(initializeParams.minDeposit.toNumber());
    expect(bettingStateAccount.maxBet.toNumber()).to.equal(initializeParams.maxBet.toNumber());
    expect(bettingStateAccount.houseFee.toNumber()).to.equal(initializeParams.houseFee.toNumber());
    expect(bettingStateAccount.depositFee.toNumber()).to.equal(initializeParams.depositFee.toNumber());
    expect(bettingStateAccount.cashoutFee.toNumber()).to.equal(initializeParams.cashoutFee.toNumber());
    expect(bettingStateAccount.totalSolReserve.toNumber()).to.equal(0);
    expect(bettingStateAccount.totalDumbsInCirculation.toNumber()).to.equal(0);
    expect(bettingStateAccount.totalPotentialPayout.toNumber()).to.equal(0);
  });

  it("Initializes a user account", async () => {
    const [userAccount] = await PublicKey.findProgramAddressSync(
      [Buffer.from("user_account"), user1.publicKey.toBuffer()],
      programId
    );

    await program.methods
      .userInitialize()
      .accounts({
        user: user1.publicKey,
        userAccount: userAccount,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user1])
      .rpc();

    const userAccountData = await program.account.userAccount.fetch(userAccount) as any;
    expect(userAccountData.authority.toString()).to.equal(user1.publicKey.toString());
    expect(userAccountData.solBalance.toNumber()).to.equal(0);
    expect(userAccountData.dumbsBalance.toNumber()).to.equal(0);
  });

  it("Deposits SOL", async () => {
    const depositAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, user1.publicKey);

    await program.methods
      .depositSol(depositAmount)
      .accounts({
        depositor: user1.publicKey,
        solVault: solVault,
        dumbsMint: dumbsMint,
        userDumbsAccount: userDumbsAccount,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user1])
      .preInstructions([
        createAssociatedTokenAccountInstruction(
          user1.publicKey,
          userDumbsAccount,
          user1.publicKey,
          dumbsMint
        ),
      ])
      .rpc();

    const userDumbsAccountInfo = await anchor.getProvider().connection.getTokenAccountBalance(userDumbsAccount);
    expect(userDumbsAccountInfo.value.uiAmount).to.equal(990); // 1000 DUMBS - 1% deposit fee
  });

  it("Places a bet", async () => {
    const betAmount = new anchor.BN(0.5 * LAMPORTS_PER_SOL);
    const fightId = new anchor.BN(1);
    const odds = new anchor.BN(200); // 2.00 odds

    const [betAccount] = await PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user1.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
      programId
    );

    await program.methods
      .placeBet(betAmount, fightId, odds)
      .accounts({
        bettor: user1.publicKey,
        userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user1.publicKey),
        betVault: betVault,
        bet: betAccount,
        bettingState: bettingState,
        dumbsMint: dumbsMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      } as any)
      .signers([user1])
      .rpc();

    const betAccountData = await program.account.bet.fetch(betAccount) as any;
    expect(betAccountData.bettor.toString()).to.equal(user1.publicKey.toString());
    expect(betAccountData.amount.toNumber()).to.equal(betAmount.toNumber());
    expect(betAccountData.fightId.toNumber()).to.equal(fightId.toNumber());
    expect(betAccountData.odds.toNumber()).to.equal(odds.toNumber());
    expect(betAccountData.settled).to.be.false;
  });

  it("Settles a bet", async () => {
    const fightId = new anchor.BN(1);
    const [betAccount] = await PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), user1.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
      programId
    );

    await program.methods
      .settleBet(fightId, user1.publicKey)
      .accounts({
        authority: authority.publicKey,
        betVault: betVault,
        bet: betAccount,
        bettorDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user1.publicKey),
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([authority])
      .rpc();

    const betAccountData = await program.account.bet.fetch(betAccount) as any;
    expect(betAccountData.settled).to.be.true;

    const userDumbsAccountInfo = await anchor.getProvider().connection.getTokenAccountBalance(
      await getAssociatedTokenAddress(dumbsMint, user1.publicKey)
    );
    // Check if the user received their winnings (this will depend on your specific implementation)
    expect(userDumbsAccountInfo.value.uiAmount).to.be.greaterThan(990);
  });

  it("Cashes out", async () => {
    const cashoutAmount = new anchor.BN(500 * 1e9); // 500 DUMBS

    const initialSolBalance = await anchor.getProvider().connection.getBalance(user1.publicKey);

    await program.methods
      .cashOut(cashoutAmount)
      .accounts({
        user: user1.publicKey,
        userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user1.publicKey),
        solVault: solVault,
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([user1])
      .rpc();

    const finalSolBalance = await anchor.getProvider().connection.getBalance(user1.publicKey);
    const solReceived = finalSolBalance - initialSolBalance;

    // Check if the user received the correct amount of SOL (considering exchange rate and cashout fee)
    expect(solReceived).to.be.closeTo(0.495 * LAMPORTS_PER_SOL, 0.001 * LAMPORTS_PER_SOL);
  });

  it("Fails to deposit below minimum amount", async () => {
    const depositAmount = new anchor.BN(0.05 * LAMPORTS_PER_SOL); // Less than minDeposit

    try {
      await program.methods
        .depositSol(depositAmount)
        .accounts({
          depositor: user2.publicKey,
          solVault: solVault,
          dumbsMint: dumbsMint,
          userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user2.publicKey),
          bettingState: bettingState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([user2])
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect((error as Error).message).to.include("Deposit amount is too small");
    }
  });

  it("Fails to place bet above maximum amount", async () => {
    const betAmount = new anchor.BN(1.5 * LAMPORTS_PER_SOL); // More than maxBet
    const fightId = new anchor.BN(2);
    const odds = new anchor.BN(150);

    try {
      await program.methods
        .placeBet(betAmount, fightId, odds)
        .accounts({
          bettor: user1.publicKey,
          userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user1.publicKey),
          betVault: betVault,
          bet: await PublicKey.findProgramAddressSync(
            [Buffer.from("bet"), user1.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
            programId
          )[0],
          bettingState: bettingState,
          dumbsMint: dumbsMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        } as any)
        .signers([user1])
        .rpc();
      expect.fail("The transaction should have failed");
    } catch (error) {
      expect((error as Error).message).to.include("Bet amount is too large");
    }
  });
});