import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { BettingProgram } from '../target/types/betting_program';
import  BettingProgramIDL from '../target/idl/betting_program.json';

// Re-export the imported IDL and type
export { BettingProgram, BettingProgramIDL };

// The programId is imported from the program IDL.
export const BETTING_PROGRAM_ID = new PublicKey(BettingProgramIDL.address);

// This is a helper function to get the Basic Anchor program.
export function getBettingProgram(provider: AnchorProvider) {
    return new Program(BettingProgramIDL as BettingProgram, provider);
}