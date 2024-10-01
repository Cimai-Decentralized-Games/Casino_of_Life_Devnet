import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NftGameAgentProgram } from "../target/types/nft_game_agent_program";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID as METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { expect } from "chai";

describe("NFT Game Agent Minting", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftGameAgentProgram as Program<NftGameAgentProgram>;

  let collectionKeypair: Keypair;
  let aiAgentKeypair: Keypair;
  let mintKeypair: Keypair;

  before(async () => {
    collectionKeypair = Keypair.generate();
    aiAgentKeypair = Keypair.generate();
    mintKeypair = Keypair.generate();

    // Create collection (you may need to implement this based on your existing code)
    // await createCollection(collectionKeypair.publicKey);
  });

  it("Initializes AI agent accounts", async () => {
    const [aiAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("ai_agent"), aiAgentKeypair.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .initializeAiAgentAccounts(aiAgentKeypair.publicKey)
      .accounts({
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        aiAgent: aiAgentPda,
        mint: mintKeypair.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([mintKeypair])
      .rpc();

    // Add assertions to verify the accounts were initialized correctly
  });

  it("Mints an AI agent NFT", async () => {
    const [aiAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("ai_agent"), aiAgentKeypair.publicKey.toBuffer()],
      program.programId
    );

    const [collectionPda, collectionBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection"), collectionKeypair.publicKey.toBuffer()],
      program.programId
    );

    const tokenAccount = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: provider.wallet.publicKey,
    });

    const metadataAddress = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      METADATA_PROGRAM_ID
    )[0];

    const masterEditionAddress = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from("edition"),
      ],
      METADATA_PROGRAM_ID
    )[0];

