import { Connection, PublicKey } from '@solana/web3.js';
import anchorPkg from '@coral-xyz/anchor';
import { IDL } from './program_idl.mjs'; // Ensure this file exists and is also .mjs

let gun;

export function initializeGun(gunInstance) {
  gun = gunInstance;
}

const { Program, AnchorProvider, BN } = anchorPkg;
// Replace 'Your_Program_ID_Here' with your actual Solana program ID
const PROGRAM_ID = new PublicKey('11111111111111111111111111111111');

function getProvider() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  // Note: This needs to be adjusted for server-side usage
  // You might want to use a keypair or other authentication method
  return new AnchorProvider(connection, {}, { preflightCommitment: 'confirmed' });
}

function calculateTokens(performance) {
  // Implement your token calculation logic here
  // This is a placeholder implementation
  return Math.floor(performance.score / 100); // Example: 1 token per 100 score points
}

export async function distributeTokens(agentId) {
  try {
    const { getPerformance } = await import('../db/gamePerformance.mjs');
    const performance = await getPerformance(agentId);
    const tokensToMint = calculateTokens(performance);

    const provider = getProvider();
    const program = new Program(IDL, PROGRAM_ID, provider);

    const tx = await program.methods.mintTokens(new BN(tokensToMint))
      .accounts({
        // Your accounts here
        // Example:
        // tokenMint: tokenMintPubkey,
        // tokenAccount: tokenAccountPubkey,
        // owner: provider.wallet.publicKey,
        // tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(`Tokens minted successfully. Transaction signature: ${tx}`);
    return tx;
  } catch (error) {
    console.error('Error distributing tokens:', error);
    throw error;
  }
}

export async function burnTokens(agentId, amount) {
  try {
    const provider = getProvider();
    const program = new Program(IDL, PROGRAM_ID, provider);

    const tx = await program.methods.burnTokens(new BN(amount))
      .accounts({
        // Your accounts here
        // Example:
        // tokenMint: tokenMintPubkey,
        // tokenAccount: tokenAccountPubkey,
        // owner: provider.wallet.publicKey,
        // tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log(`Tokens burned successfully. Transaction signature: ${tx}`);
    return tx;
  } catch (error) {
    console.error('Error burning tokens:', error);
    throw error;
  }
}

export async function recordSaveStateOnChain(stateHash, p1Health, p2Health, roundNumber, p1Score, p2Score, gameClock) {
  try {
    const provider = getProvider();
    const program = new Program(IDL, PROGRAM_ID, provider);

    const tx = await program.methods.recordSaveState(
      stateHash,
      new BN(p1Health),
      new BN(p2Health),
      new BN(roundNumber),
      new BN(p1Score),
      new web3.BN(p2Score),
      new web3.BN(gameClock)
    )
      .accounts({
        // Your accounts here
      })
      .rpc();

    console.log(`Save state recorded on chain. Transaction signature: ${tx}`);
    return tx;
  } catch (error) {
    console.error('Error recording save state on chain:', error);
    throw error;
  }
}