import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { BettingProgram } from "../target/types/betting_program";
import { expect } from "chai";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";

describe("betting_program_error_conditions", () => {
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
    // Setup code (similar to main test file)
    // ...
  });

  it("Fails to initialize program with invalid parameters", async () => {
    const invalidParams = {
      exchangeRate: new anchor.BN(0),
      minDeposit: new anchor.BN(0),
      maxBet: new anchor.BN(0),
      houseFee: new anchor.BN(1000), // 100% fee
      depositFee: new anchor.BN(1000), // 100% fee
      cashoutFee: new anchor.BN(1000), // 100% fee
    };

    try {
      await program.methods.initialize(invalidParams)
        .accounts({
          authority: authority.publicKey,
          bettingState: bettingState,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
      expect.fail("Should have failed with invalid parameters");
    } catch (error) {
      expect(error.message).to.include("Invalid program parameters");
    }
  });

  it("Fails to place bet with insufficient funds", async () => {
    const betAmount = new anchor.BN(100 * LAMPORTS_PER_SOL); // More than user balance
    const fightId = new anchor.BN(1);
    const odds = new anchor.BN(200);

    try {
      await program.methods.placeBet(betAmount, fightId, odds)
        .accounts({
          bettor: user.publicKey,
          userDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user.publicKey),
          betVault: betVault,
          bet: await PublicKey.findProgramAddress(
            [Buffer.from("bet"), user.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
            program.programId
          )[0],
          bettingState: bettingState,
          dumbsMint: dumbsMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user])
        .rpc();
      expect.fail("Should have failed with insufficient funds");
    } catch (error) {
      expect(error.message).to.include("Insufficient funds");
    }
  });

  it("Fails to settle bet with unauthorized authority", async () => {
    const fightId = new anchor.BN(1);
    const unauthorizedUser = Keypair.generate();

    try {
      await program.methods.settleBet(fightId, user.publicKey)
        .accounts({
          authority: unauthorizedUser.publicKey,
          betVault: betVault,
          bet: await PublicKey.findProgramAddress(
            [Buffer.from("bet"), user.publicKey.toBuffer(), fightId.toArrayLike(Buffer, 'le', 8)],
            program.programId
          )[0],
          bettorDumbsAccount: await getAssociatedTokenAddress(dumbsMint, user.publicKey),
          dumbsMint: dumbsMint,
          bettingState: bettingState,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([unauthorizedUser])
        .rpc();
      expect.fail("Should have failed with unauthorized authority");
    } catch (error) {
      expect(error.message).to.include("unauthorized");
    }
  });

  // Add more error condition tests as needed
});
