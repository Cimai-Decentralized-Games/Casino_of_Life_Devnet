import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, setProvider } from '@coral-xyz/anchor';
import { IDL } from '../../anchor/target/idl/betting_program.json';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as fs from 'fs';

const PROGRAM_ID = new PublicKey('6BB4BpJeSqAw6eXSvG7Mvy6wXmhoY1XVN5vJbZhGn4TU');

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const authorityKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync('/Users/caballoloko/.config/solana/new_program_keypair.json', 'utf-8')))
  );
  const wallet = new Wallet(authorityKeypair);
  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'confirmed' });
  setProvider(provider);

  const program = new Program(IDL, PROGRAM_ID);

  const betVault = new PublicKey('7LTYTDrGkTHXfdWDoF9uvfCSAoqeg6av1msD5EvsQfow');
  const dumbsMint = new PublicKey('Df5q9roWvftKuCaZZ3NjKWDfbxpgvztg8oywb51zCdTz');
  const bettingState = new PublicKey('3ne82WHaU8hmvqzrMhn6wPiz5BnuagUkFEjYiDcJvpMh');

  try {
    const tx = await program.methods
      .initializeBetVault()
      .accounts({
        authority: authorityKeypair.publicKey,
        betVault: betVault,
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    console.log('Bet vault initialized successfully. Transaction ID:', tx);
  } catch (error) {
    console.error('Failed to initialize bet vault:', error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});