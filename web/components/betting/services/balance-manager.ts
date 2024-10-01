import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { BETTING_PROGRAM_ID } from '@casino-of-life-dashboard/anchor';

export class BalanceManager {
  constructor(private connection: Connection) {}

  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  }

  async getFreeDumbsBalance(publicKey: PublicKey): Promise<number> {
    const [DumbsMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("dumbs_mint")],
      BETTING_PROGRAM_ID
    );
    const userFreeDumbsAccount = await getAssociatedTokenAddress(DumbsMint, publicKey);
    
    try {
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(userFreeDumbsAccount);
      return parseFloat(tokenAccountInfo.value.uiAmount?.toString() || '0');
    } catch (error) {
      console.error('Error fetching freeDUMBS balance:', error);
      return 0;
    }
  }
}