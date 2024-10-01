import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { AnchorProvider, Wallet, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';

export const cashOut = async (
  connection: Connection,
  wallet: Wallet,
  fightId: number
): Promise<string> => {
  console.log('Starting cashOut function');
  console.log('BETTING_PROGRAM_ID:', BETTING_PROGRAM_ID.toBase58());

  const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  const program = getBettingProgram(provider);

  const [bettingState] = PublicKey.findProgramAddressSync([Buffer.from('betting_state')], BETTING_PROGRAM_ID);
  const [solVault] = PublicKey.findProgramAddressSync([Buffer.from('sol_vault')], BETTING_PROGRAM_ID);
  const [dumbsMint] = PublicKey.findProgramAddressSync([Buffer.from('dumbs_mint')], BETTING_PROGRAM_ID);
  const [bet] = PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), wallet.publicKey.toBuffer(), new BN(fightId).toArrayLike(Buffer, 'le', 8)],
    BETTING_PROGRAM_ID
  );

  console.log('Betting State:', bettingState.toBase58());
  console.log('SOL Vault:', solVault.toBase58());
  console.log('DUMBS Mint:', dumbsMint.toBase58());
  console.log('Bet:', bet.toBase58());

  try {
    const userDumbsAccount = await getAssociatedTokenAddress(dumbsMint, wallet.publicKey);

    console.log('User DUMBS Account:', userDumbsAccount.toBase58());

    const tx = await program.methods
      .cashOut(new BN(fightId))
      .accounts({
        bettor: wallet.publicKey,
        userDumbsAccount: userDumbsAccount,
        betVault: solVault,
        bet: bet,
        bettingState: bettingState,
        dumbsMint: dumbsMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log('Cash out successful. Transaction ID:', tx);
    return tx;
  } catch (error) {
    console.error('Error in cashOut:', error);
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