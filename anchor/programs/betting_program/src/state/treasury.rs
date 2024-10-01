use anchor_lang::prelude::*;

pub const TREASURY_SEED: &[u8] = b"treasury";
pub const BET_FEE: u64 = 10_000_000; // 0.01 SOL
pub const HOUSE_EDGE: u64 = 1_000_000; // 0.001 SOL
pub const MIN_TREASURY_BALANCE: u64 = 1_000_000_000; // 1 SOL

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub total_collected: u64,
    pub total_paid_out: u64,
    pub house_edge_collected: u64,
    pub bet_fees_collected: u64,
    pub last_payout_timestamp: i64,
}

impl Treasury {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 8 + 8;

    pub fn initialize(&mut self, authority: Pubkey) {
        self.authority = authority;
        self.total_collected = 0;
        self.total_paid_out = 0;
        self.house_edge_collected = 0;
        self.bet_fees_collected = 0;
        self.last_payout_timestamp = 0;
    }

    pub fn collect_bet_fee(&mut self, amount: u64) {
        self.total_collected += amount;
        self.bet_fees_collected += amount;
    }

    pub fn collect_house_edge(&mut self, amount: u64) {
        self.total_collected += amount;
        self.house_edge_collected += amount;
    }

    pub fn payout(&mut self, amount: u64) -> Result<()> {
        require!(self.total_collected >= amount + MIN_TREASURY_BALANCE, TreasuryError::InsufficientFunds);
        self.total_collected -= amount;
        self.total_paid_out += amount;
        self.last_payout_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }

    pub fn get_balance(&self) -> u64 {
        self.total_collected
    }

    pub fn transfer_to_sol_vault(&mut self, amount: u64) -> Result<()> {
        require!(self.total_collected >= amount, TreasuryError::InsufficientFunds);
        self.total_collected -= amount;
        Ok(())
    }

    pub fn receive_from_sol_vault(&mut self, amount: u64) {
        self.total_collected += amount;
    }
}

#[error_code]
pub enum TreasuryError {
    #[msg("Insufficient funds in the treasury")]
    InsufficientFunds,
}