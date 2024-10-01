import * as web3 from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Program, Idl } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import type { Errors } from "../target/types/errors";

type CollectionAccount = {
  name: string;
  symbol: string;
  collectionId: number;
};

describe("Create Collection", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Errors as anchor.Program<Errors>;
  
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftGameAgentProgram as Program<Idl>;

  before(() => {
    console.log("Program ID:", program.programId.toString());
  });

  it("Creates a collection", async () => {
    try {
      const collectionName = "Test Collection";
      const collectionSymbol = "TEST";

      const [collectionPDA, _collectionBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection"), provider.wallet.publicKey.toBuffer()],
        program.programId
      );

      console.log("Collection PDA:", collectionPDA.toString());

      const tx = await program.methods
        .createCollection(collectionName, collectionSymbol)
        .accounts({
          collection: collectionPDA,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Transaction signature:", tx);

      // Fetch the created collection account
      const collectionAccount = (await program.account.collection.fetch(
        collectionPDA
      )) as CollectionAccount;

      console.log("Collection account:", collectionAccount);

      // Assert the collection data
      expect(collectionAccount.name.toString().trim()).to.equal(collectionName);
      expect(collectionAccount.symbol.toString().trim()).to.equal(
        collectionSymbol
      );
      expect(collectionAccount.collectionId).to.be.a("number");
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});
