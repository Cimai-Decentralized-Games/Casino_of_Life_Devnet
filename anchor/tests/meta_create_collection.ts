import * as anchor from "@coral-xyz/anchor";
import { Program, Idl, AnchorError } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SendTransactionError, Transaction, sendAndConfirmTransaction, SendOptions } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import {
  findMasterEditionPda,
  findMetadataPda,
  mplTokenMetadata,
  MPL_TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { ComputeBudgetProgram } from "@solana/web3.js";

describe("nft-game-agent-program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftGameAgentProgram as Program<Idl>;
  console.log("Program ID:", program.programId.toString());
  const umi = createUmi("https://api.devnet.solana.com").use(mplTokenMetadata());

  before(() => {
    console.log("Program ID:", program.programId.toString());
    // You might want to add a check here to ensure your local server is running
    // This is just a basic check and might not work in all environments
    fetch("http://localhost:8080/metadata.json")
      .then(response => {
        if (!response.ok) {
          console.warn("Local metadata server might not be running. Ensure it's started on port 8080.");
        }
      })
      .catch(error => {
        console.warn("Could not reach local metadata server. Ensure it's started on port 8080.");
      });
  });

  it("Creates a collection and mints an AI agent NFT", async () => {
    try {
      const name = "Collection";
      const symbol = "TEST";
      const validStrategy = "DQN";

      const collectionId = Keypair.generate().publicKey;
      
      const [collectionPDA, collectionBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), collectionId.toBuffer()],
        program.programId
      );
      
      // Create collection
      await program.methods.createCollection(name, symbol, validStrategy, collectionId)
        .accounts({
          collection: collectionPDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      // Set up for minting NFT
      const agentId = Keypair.generate().publicKey;
      const mint = Keypair.generate();
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mint.publicKey,
        provider.wallet.publicKey
      );

      const [aiAgentPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("ai_agent"), agentId.toBuffer()],
        program.programId
      );

      let metadataAccount = findMetadataPda(umi, {
        mint: publicKey(mint.publicKey),
      })[0];

      let masterEditionAccount = findMasterEditionPda(umi, {
        mint: publicKey(mint.publicKey),
      })[0];

      const metadata = {
        name: "AI Agent NFT",
        symbol: "AINFT",
        uri: "http://localhost:8080/metadata.json",
      };

      const modelHash = Array(32).fill(1); // Example model hash

       // Log accounts for debugging
       console.log("Accounts for mintAiAgent:", {
        authority: provider.wallet.publicKey.toBase58(),
        payer: provider.wallet.publicKey.toBase58(),
        aiAgent: aiAgentPDA.toBase58(),
        mint: mint.publicKey.toBase58(),
        tokenAccount: associatedTokenAccount.toBase58(),
        collection: collectionPDA.toString(),
        metadata: metadataAccount.toString(),
        masterEdition: masterEditionAccount.toString(),
      });

      // Log PDAs
      console.log("AI Agent PDA:", aiAgentPDA.toBase58());
      console.log("Collection PDA:", collectionPDA.toBase58());
      console.log("Metadata PDA:", metadataAccount.toString());
      console.log("Master Edition PDA:", masterEditionAccount.toString());

      // Initialize AI Agent account
      await program.methods.initializeAiAgentAccounts(agentId)
        .accounts({
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          aiAgent: aiAgentPDA,
          mint: mint.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc();

      // Create the compute budget instruction
      const computeBudgetIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 2000000 // Adjust this value as needed
      });

      // Mint AI Agent NFT
      const tx = await program.methods
        .mintAiAgent(
          agentId,
          metadata.name,
          metadata.symbol,
          metadata.uri,
          modelHash,
          collectionId,
          collectionBump
        )
        .accounts({
          authority: provider.wallet.publicKey,
          payer: provider.wallet.publicKey,
          aiAgent: aiAgentPDA,
          mint: mint.publicKey,
          tokenAccount: associatedTokenAccount,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
          collection: collectionPDA,
          metadata: metadataAccount,
          masterEdition: masterEditionAccount,
        })
        .preInstructions([computeBudgetIx]) // Add the compute budget instruction here
        .signers([mint])
        .rpc();

      console.log("Transaction signature:", tx);

    } catch (error) {
      console.error("Error minting AI Agent NFT:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      if (error instanceof anchor.AnchorError) {
        console.error("Error code:", error.error.errorCode.number);
        console.error("Error message:", error.error.errorMessage);
        console.error("Error logs:", error.logs);
      }
      throw error; // Re-throw the error to fail the test
    }
  });

  // You might want to add more tests for different strategies
  it("Creates collections with different valid strategies", async () => {
    const strategies = ["A2C", "PPO", "DDPG", "TD3", "SAC", "TRPO", "REINFORCE"];
    
    for (const strategy of strategies) {
        const collectionId = Keypair.generate().publicKey;
        const [collectionPDA, _] = PublicKey.findProgramAddressSync(
            [Buffer.from("collection"), collectionId.toBuffer()],
            program.programId
        );
        
        await program.methods.createCollection(`Test ${strategy}`, strategy, strategy, collectionId)
            .accounts({
                collection: collectionPDA,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        
        // You might want to add some assertions here to verify the collection was created correctly
    }
  });

  it("Fails to create a collection with an invalid strategy", async () => {
    const collectionId = Keypair.generate().publicKey;
    const [collectionPDA, _] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), collectionId.toBuffer()],
        program.programId
    );
    
    try {
        await program.methods.createCollection("Invalid Test", "INV", "INVALID_STRATEGY", collectionId)
            .accounts({
                collection: collectionPDA,
                authority: provider.wallet.publicKey,
                systemProgram: anchor.web3.SystemProgram.programId,
            })
            .rpc();
        assert.fail("Expected an error but none was thrown");
    } catch (error) {
        assert.equal(error.error.errorCode.code, "InvalidStrategy");
    }
  });

  // ... rest of your test cases ...
});