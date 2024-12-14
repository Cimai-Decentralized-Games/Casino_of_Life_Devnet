import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import type { FreedumbsControllerProgram } from '../target/types/freedumbs_controller_program';
import  FreedumbsControllerProgramIDL from '../target/idl/freedumbs_controller_program.json';

// Re-export the imported IDL and type
export { FreedumbsControllerProgram, FreedumbsControllerProgramIDL };

// The programId is imported from the program IDL.
export const FREEDUMBS_CONTROLLER_PROGRAM_ID = new PublicKey(FreedumbsControllerProgramIDL.address);

// This is a helper function to get the Basic Anchor program.
export function getFreedumbsControllerProgram(provider: AnchorProvider) {
    return new Program(FreedumbsControllerProgramIDL as FreedumbsControllerProgram, provider);
}