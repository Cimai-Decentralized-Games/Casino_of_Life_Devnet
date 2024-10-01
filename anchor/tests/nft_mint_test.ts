import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { findMasterEditionPda, findMetadataPda, MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { PublicKey } from "@solana/web3.js";
import { NftGameAgentProgram } from "../target/types/nft_game_agent_program";

describe("NftGameAgentProgram - Mint NFT", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.NftGameAgentProgram as Program<NftGameAgentProgram>;
  const umi = createUmi("https://api.devnet.solana.com");

  it("mints an NFT from existing collection", async () => {
    console.log("Starting NFT minting test");

    const mint = anchor.web3.Keypair.generate();
    console.log(`Generated mint keypair: ${mint.publicKey.toString()}`);

    const metadataAccount = new PublicKey(findMetadataPda(umi, { mint: publicKey(mint.publicKey) })[0]);
    console.log(`Metadata account: ${metadataAccount.toString()}`);

    const masterEditionAccount = new PublicKey(findMasterEditionPda(umi, { mint: publicKey(mint.publicKey) })[0]);
    console.log(`Master edition account: ${masterEditionAccount.toString()}`);

    const metadata = {
      name: "AI Agent",
      symbol: "AIA",
      uri: "https://example.com/metadata.json",
    };
    console.log("Metadata:", metadata);

    const collectionId = new PublicKey("B5MUpZbz2ADpotdALJLiNkhDqbC8GwPWS2HBXzngYD55");
    console.log(`Collection ID: ${collectionId.toString()}`);

    const modelHash = Array(32).fill(1);
    console.log("Model hash:", modelHash);

    const collectionBump = 1;
    console.log(`Collection bump: ${collectionBump}`);

    console.log("Preparing to call mintAiAgent...");
    try {
      const tx = await program.methods
        .mintAiAgent(
          mint.publicKey,
          metadata.name,
          metadata.symbol,
          metadata.uri,
          modelHash,
          collectionId,
          collectionBump
        )
        .accounts({
          payer: provider.publicKey,
          mint: mint.publicKey,
          metadata: metadataAccount,
          masterEdition: masterEditionAccount,
        })
        .remainingAccounts([
          { pubkey: TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
          { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isWritable: false, isSigner: false },
          { pubkey: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID), isWritable: false, isSigner: false },
        ])
        .signers([mint])
        .rpc();

      console.log(`Transaction successful. Signature: ${tx}`);
      console.log(`Minted NFT: https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);
      console.log(`Transaction: https://explorer.solana.com/tx/${tx}?cluster=devnet`);
    } catch (error) {
      console.error("Error minting NFT:", error);
      throw error;
    }
  });
});