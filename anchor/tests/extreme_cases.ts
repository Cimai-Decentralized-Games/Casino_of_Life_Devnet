import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BettingProgram } from "../target/types/betting_program";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL, u64 } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("betting_program_extreme_cases", () => {
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
    // Initialize test accounts
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

  it("Handles maximum possible deposit", async () => {
    const maxDeposit = new anchor.BN(u64.MAX_VALUE);
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, user.publicKey);

    await program.methods
      .depositSol(maxDeposit)
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
    expect(userDumbsAccountInfo.value.uiAmount).to.equal(u64.MAX_VALUE.toNumber());
  });

  it("Places multiple bets in rapid succession", async () => {
    const betAmount = new anchor.BN(0.1 * LAMPORTS_PER_SOL);
    const odds = new anchor.BN(200);
    const numBets = 100;

    const placeBetPromises = [];
    for (let i = 0; i < numBets; i++) {
      const fightId = new anchor.BN(i);
      const [betAccount] = await PublicKey.findProgramAddress(
        [Buffer.from("bet"), user.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );

      placeBetPromises.push(
        program.methods
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
          .rpc()
      );
    }

    await Promise.all(placeBetPromises);
    // Verify all bets were placed correctly
    // ...
  });

  it("Settles multiple bets simultaneously", async () => {
    // Implement test for settling multiple bets at once
    // ...
  });

  it("Handles program state with maximum values", async () => {
    const extremeParams = {
      exchangeRate: new anchor.BN(u64.MAX_VALUE),
      minDeposit: new anchor.BN(1),
      maxBet: new anchor.BN(u64.MAX_VALUE),
      houseFee: new anchor.BN(999), // 99.9% fee
      depositFee: new anchor.BN(999), // 99.9% fee
      cashoutFee: new anchor.BN(999), // 99.9% fee
    };

    await program.methods
      .initialize(extremeParams)
      .accounts({
        authority: authority.publicKey,
        bettingState: bettingState,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const bettingStateAccount = await program.account.bettingState.fetch(bettingState);
    expect(bettingStateAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(bettingStateAccount.exchangeRate.toNumber()).to.equal(extremeParams.exchangeRate.toNumber());
    expect(bettingStateAccount.minDeposit.toNumber()).to.equal(extremeParams.minDeposit.toNumber());
    expect(bettingStateAccount.maxBet.toNumber()).to.equal(extremeParams.maxBet.toNumber());
    expect(bettingStateAccount.houseFee.toNumber()).to.equal(extremeParams.houseFee.toNumber());
    expect(bettingStateAccount.depositFee.toNumber()).to.equal(extremeParams.depositFee.toNumber());
    expect(bettingStateAccount.cashoutFee.toNumber()).to.equal(extremeParams.cashoutFee.toNumber());
  });

  // Add more extreme case tests as needed
});
