import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BettingProgram } from "../target/types/betting_program";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("betting_program_edge_cases", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BettingProgram as Program<BettingProgram>;

  let authority: Keypair;
  let user: Keypair;
  let bettingState: PublicKey;
  let solVault: PublicKey;
  let dumbsMint: PublicKey;
  let betVault: PublicKey;

  before(async () => {
    // Initialize test accounts and PDAs
    authority = Keypair.generate();
    user = Keypair.generate();

    // Airdrop SOL to authority and user
    await provider.connection.requestAirdrop(authority.publicKey, 100 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL);

    // Derive PDAs
    [bettingState] = await PublicKey.findProgramAddress(
      [Buffer.from("betting_state")],
      program.programId
    );
    [solVault] = await PublicKey.findProgramAddress(
      [Buffer.from("sol_vault")],
      program.programId
    );
    [dumbsMint] = await PublicKey.findProgramAddress(
      [Buffer.from("dumbs_mint")],
      program.programId
    );
    [betVault] = await PublicKey.findProgramAddress(
      [Buffer.from("bet_vault")],
      program.programId
    );
  });

  it("Handles deposit of exactly minimum amount", async () => {
    const minDeposit = (await program.account.bettingState.fetch(bettingState)).minDeposit;
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, user.publicKey);

    await program.methods
      .depositSol(minDeposit)
      .accounts({
        depositor: user.publicKey,
        solVault: solVault,
        dumbsMint: dumbsMint,
        userDumbsAccount: userDumbsAccount,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .preInstructions([
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          userDumbsAccount,
          user.publicKey,
          dumbsMint
        ),
      ])
      .rpc();

    const userDumbsAccountInfo = await provider.connection.getTokenAccountBalance(userDumbsAccount);
    expect(userDumbsAccountInfo.value.uiAmount).to.equal(990); // 1000 DUMBS - 1% deposit fee
  });

  it("Handles bet of exactly maximum amount", async () => {
    const maxBet = (await program.account.bettingState.fetch(bettingState)).maxBet;
    const fightId = new anchor.BN(1);
    const odds = new anchor.BN(200); // 2.00 odds

    const [betAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("bet"), user.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    await program.methods
      .placeBet(maxBet, fightId, odds)
      .accounts({
        bettor: user.publicKey,
        userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user.publicKey),
        betVault: betVault,
        bet: betAccount,
        bettingState: bettingState,
        dumbsMint: dumbsMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();

    const betAccountData = await program.account.bet.fetch(betAccount);
    expect(betAccountData.bettor.toString()).to.equal(user.publicKey.toString());
    expect(betAccountData.amount.toNumber()).to.equal(maxBet.toNumber());
    expect(betAccountData.fightId.toNumber()).to.equal(fightId.toNumber());
    expect(betAccountData.odds.toNumber()).to.equal(odds.toNumber());
    expect(betAccountData.settled).to.be.false;
  });

  it("Processes bet with odds of 1 (no profit)", async () => {
    const betAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const fightId = new anchor.BN(1);
    const odds = new anchor.BN(100); // 1.00 odds

    const [betAccount] = await PublicKey.findProgramAddress(
      [Buffer.from("bet"), user.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    await program.methods
      .placeBet(betAmount, fightId, odds)
      .accounts({
        bettor: user.publicKey,
        userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user.publicKey),
        betVault: betVault,
        bet: betAccount,
        bettingState: bettingState,
        dumbsMint: dumbsMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user])
      .rpc();

    const betAccountData = await program.account.bet.fetch(betAccount);
    expect(betAccountData.bettor.toString()).to.equal(user.publicKey.toString());
    expect(betAccountData.amount.toNumber()).to.equal(betAmount.toNumber());
    expect(betAccountData.fightId.toNumber()).to.equal(fightId.toNumber());
    expect(betAccountData.odds.toNumber()).to.equal(odds.toNumber());
    expect(betAccountData.settled).to.be.false;

    // Settle the bet
    await program.methods
      .settleBet(fightId, user.publicKey)
      .accounts({
        authority: authority.publicKey,
        betVault: betVault,
        bet: betAccount,
        bettorDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user.publicKey),
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const settledBetAccountData = await program.account.bet.fetch(betAccount);
    expect(settledBetAccountData.settled).to.be.true;

    const userDumbsAccountInfo = await provider.connection.getTokenAccountBalance(
      await getAssociatedTokenAddress(dumbsMint, user.publicKey)
    );
    expect(userDumbsAccountInfo.value.uiAmount).to.equal(990); // No profit, so balance remains the same
  });

  it("Handles cashout of entire balance", async () => {
    const initialSolBalance = await provider.connection.getBalance(user.publicKey);
    const initialDumbsBalance = (await program.account.userAccount.fetch(await getAssociatedTokenAddress(dumbsMint, user.publicKey))).dumbsBalance.toNumber();

    // Deposit some amount first
    const depositAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, user.publicKey);

    await program.methods
      .depositSol(depositAmount)
      .accounts({
        depositor: user.publicKey,
        solVault: solVault,
        dumbsMint: dumbsMint,
        userDumbsAccount: userDumbsAccount,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .preInstructions([
        createAssociatedTokenAccountInstruction(
          user.publicKey,
          userDumbsAccount,
          user.publicKey,
          dumbsMint
        ),
      ])
      .rpc();

    // Then cashout entire balance
    const cashoutAmount = new anchor.BN(initialDumbsBalance + 990); // 1000 DUMBS - 1% deposit fee
    await program.methods
      .cashOut(cashoutAmount)
      .accounts({
        user: user.publicKey,
        userDumbsAccount: userDumbsAccount,
        solVault: solVault,
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const finalSolBalance = await provider.connection.getBalance(user.publicKey);

