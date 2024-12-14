import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { BETTING_PROGRAM_ID, getBettingProgram } from '@casino-of-life-dashboard/anchor';
import { AnchorProvider } from '@coral-xyz/anchor';

export class BalanceManager {
  constructor(private connection: Connection) {}

  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / 1e9; // Only SOL needs decimal conversion
  }

  async getFreeDumbsBalance(publicKey: PublicKey): Promise<number> {
    const [dumbsMint] = PublicKey.findProgramAddressSync(
      [Buffer.from("dumbs_mint")],
      BETTING_PROGRAM_ID
    );
    const userFreeDumbsAccount = await getAssociatedTokenAddress(dumbsMint, publicKey);
    
    try {
      const tokenAccountInfo = await this.connection.getTokenAccountBalance(userFreeDumbsAccount);
      console.log('Raw token account info:', tokenAccountInfo);
      const amount = tokenAccountInfo.value.uiAmount; // Use uiAmount directly
      console.log('Free DUMBS amount:', amount);
      return amount;
    } catch (error) {
      console.error('Error fetching free DUMBS balance:', error);
      return 0;
    }
  }

  private async getBetAmount(publicKey: PublicKey, fightId: string, secureFightId?: string): Promise<number> {
    if (!fightId) {
      console.log('No fight ID provided for bet amount');
      return 0;
    }

    try {
      // Use the secure fight ID instead of the display ID
      const secureFightIdBuffer = Buffer.alloc(8);
      secureFightIdBuffer.writeBigUInt64LE(BigInt(secureFightId || fightId.split('-')[0]));

      console.log('Using Secure Fight ID:', secureFightId || fightId.split('-')[0]);
      console.log('Buffer:', secureFightIdBuffer);

      // Create bet account PDA
      const [bet] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("bet"),
          publicKey.toBuffer(),
          secureFightIdBuffer
        ],
        BETTING_PROGRAM_ID
      );

      console.log('Looking for bet account:', bet.toString());

      const provider = new AnchorProvider(
        this.connection,
        {
          publicKey,
          signTransaction: async () => { throw new Error('Wallet not needed for reading'); },
          signAllTransactions: async () => { throw new Error('Wallet not needed for reading'); },
        },
        { commitment: 'confirmed' }
      );
      
      const program = getBettingProgram(provider);

      const betData = await program.account.bet.fetch(bet);
      console.log('Found bet data:', {
        amount: betData.amount.toString(),
        settled: betData.settled,
        bettor: betData.bettor.toString()
      });
      // Convert bet amount to match UI format
      return Math.floor(Number(betData.amount));  // Ensure whole numbers

    } catch (error) {
      if (error.message?.includes('Account does not exist')) {
        console.log('No bet account found for fight:', fightId);
        return 0;
      }
      console.error('Error fetching bet amount:', error);
      console.error('Error details:', {
        publicKey: publicKey.toString(),
        fightId,
        error: error.message
      });
      return 0;
    }
  }

  async getTotalDumbsBalance(
    publicKey: PublicKey, 
    activeFightId?: string,
    secureFightId?: string
  ): Promise<{
    freeDumbs: number;
    betDumbs: number;
    totalDumbs: number;
  }> {
    try {
      const freeDumbs = await this.getFreeDumbsBalance(publicKey);
      let betDumbs = 0;

      if (activeFightId) {
        betDumbs = await this.getBetAmount(publicKey, activeFightId, secureFightId);
      }

      const totalDumbs = Math.floor(freeDumbs) + betDumbs;  // Floor the free DUMBS

      return {
        freeDumbs: Math.floor(freeDumbs),  // Floor to remove decimals
        betDumbs,
        totalDumbs
      };

    } catch (error) {
      console.error('Error getting total balance:', error);
      console.error('Error context:', {
        publicKey: publicKey?.toString(),
        activeFightId
      });
      return {
        freeDumbs: 0,
        betDumbs: 0,
        totalDumbs: 0
      };
    }
  }

  async updateBalancesForFight(
    publicKey: PublicKey, 
    fightId: string,
    secureFightId?: string
  ): Promise<{
    freeDumbs: number;
    betDumbs: number;
    totalDumbs: number;
  }> {
    console.log('Updating balances for fight:', fightId, 'secure ID:', secureFightId);
    
    // Force a fresh connection with confirmed commitment
    const connection = new Connection(this.connection.rpcEndpoint, 'confirmed');
    this.connection = connection;
    
    // Get fresh balances with secure fight ID
    const balances = await this.getTotalDumbsBalance(publicKey, fightId, secureFightId);
    
    console.log('Updated DUMBS balances:', {
      free: balances.freeDumbs,
      bet: balances.betDumbs,
      total: balances.totalDumbs,
      fightId,
      secureFightId
    });
    
    return balances;
  }
}