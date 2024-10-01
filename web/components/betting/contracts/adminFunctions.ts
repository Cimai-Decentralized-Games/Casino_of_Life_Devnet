// File: web/components/betting/contracts/adminFunctions.ts

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { Buffer } from 'buffer';

export const initializeBetVault = async (
  programId: PublicKey,
  adminWallet: any,
  connection: Connection
): Promise<string> => {
  const provider = new AnchorProvider(connection, adminWallet, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);

  const [bettingState] = PublicKey.findProgramAddressSync(
    [Buffer.from("betting_state")],
    program.programId
  );
  const [betVault] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet_vault")],
    program.programId
  );
  const [dumbsMint] = PublicKey.findProgramAddressSync([Buffer.from('dumbs_mint')], programId);

  try {
    console.log('Initializing Bet Vault...');
    const tx = await program.methods
      .initializeBetVault()
      .accounts({
        authority: adminWallet.publicKey,
        betVault: betVault,
        dumbsMint: dumbsMint,
        bettingState: bettingState,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      } as any)
      .rpc();

    console.log('Bet vault initialized. Transaction ID:', tx);
    return tx;
  } catch (error) {
    console.error('Error in initializeBetVault:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      if ('logs' in error) {
        console.error('Error logs:', (error as any).logs);
      }
    }
    throw error;
  }
};