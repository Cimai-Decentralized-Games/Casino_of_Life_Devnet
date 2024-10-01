use anchor_lang::prelude::*;

pub const DUMBS_TREASURY_SEED: &[u8] = b"dumbs_treasury";

#[account]
pub struct DumbsTreasury {
    pub treasury_account: Pubkey,
    pub total_collected: u64,
}

impl DumbsTreasury {
    pub const LEN: usize = 32 + 8;

    pub fn initialize(&mut self, treasury_account: Pubkey) {
        self.treasury_account = treasury_account;
        self.total_collected = 0;
    }

    pub fn collect_fee(&mut self, amount: u64) {
        self.total_collected += amount;
    }
}