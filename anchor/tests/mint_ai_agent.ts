import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from 'chai';
import { NftGameAgentProgram } from "../target/types/nft_game_agent_program";

describe("Mint AI Agent NFT", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.NftGameAgentProgram as Program<NftGameAgentProgram>;
  const provider = anchor.AnchorProvider.env();

  it("Mints an AI Agent NFT", async () => {
    // Generate a new public key for the AI Agent
    const agentId = Keypair.generate().publicKey;

    // Use an existing collection
    // Replace this with the actual public key of your existing collection
    const collectionPDA = new PublicKey("B5MUpZbz2ADpotdALJLiNkhDqbC8GwPWS2HBXzngYD55");

    // Fetch the collection account to get its bump
    const collectionAccount = await program.account.collection.fetch(collectionPDA);
    const collectionBump = collectionAccount.bump;

    console.log("Using existing collection:", collectionPDA.toBase58());

    // Prepare AI Agent NFT data
    const name = "AI Agent";
    const symbol = "AIA";
    const uri = "http://localhost:8000/metadata.json";
    const modelHash = new Array(32).fill(1); // Create a byte array of length 32

    const [aiAgentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("ai_agent"), agentId.toBuffer()],
      program.programId
    );

    const [mint] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint"), agentId.toBuffer()],
      program.programId
    );

    const tokenAccount = await anchor.utils.token.associatedAddress({
      mint: mint,
      owner: provider.wallet.publicKey,
    });

    const metadataProgramId = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    const [metadata] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), metadataProgramId.toBuffer(), mint.toBuffer()],
      metadataProgramId
    );

    const [masterEdition] = PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"), metadataProgramId.toBuffer(), mint.toBuffer(), Buffer.from("edition")],
      metadataProgramId
    );

    console.log("Minting AI Agent NFT...");
    try {
      const tx = await program.methods.mintAiAgent(
        agentId,
        name,
        symbol,
        uri,
        modelHash,
        collectionPDA,
        collectionBump
      ).accounts({
        authority: provider.wallet.publicKey,
        payer: provider.wallet.publicKey,
        aiAgentAccount: aiAgentPDA,
        mint: mint,
        tokenAccount: tokenAccount,
        metadata: metadata,
        masterEdition: masterEdition,
        collection: collectionPDA,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
        metadataProgram: metadataProgramId,
      }).rpc();

      console.log("Mint transaction signature", tx);

      // Add assertions to verify the minted NFT
      const mintInfo = await provider.connection.getAccountInfo(mint);
      expect(mintInfo).to.not.be.null;
      
      const tokenAccountInfo = await provider.connection.getAccountInfo(tokenAccount);
      expect(tokenAccountInfo).to.not.be.null;

      const aiAgentInfo = await provider.connection.getAccountInfo(aiAgentPDA);
      expect(aiAgentInfo).to.not.be.null;

      console.log("AI Agent NFT minted and verified successfully");
    } catch (error) {
      console.error("Error minting AI Agent NFT:", error);
      throw error;
    }
  });
});