// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { NftGameAgentProgram } from '../target/types/nft_game_agent_program';
import NftGameAgentProgramIDL from '../target/idl/nft_game_agent_program.json';

// Re-export the imported IDL and type
export { NftGameAgentProgram, NftGameAgentProgramIDL };

// The programId is imported from the program IDL.
export const NFT_GAME_AGENT_PROGRAM_ID = new PublicKey(NftGameAgentProgramIDL.address);

// This is a helper function to get the Basic Anchor program.
export function getNftGameAgentProgram(provider: AnchorProvider) {
  return new Program(NftGameAgentProgramIDL as NftGameAgentProgram, provider);
}