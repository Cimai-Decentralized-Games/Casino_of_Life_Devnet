use anchor_lang::prelude::*;

pub const TREASURY_SEED: &[u8] = b"treasury";
pub const COLLECTION_FEE: u64 = 10_000_000; // 0.01 SOL
pub const AGENT_FEE: u64 = 20_000_000; // 0.02 SOL

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub total_collected: u64,
}

impl Treasury {
    pub const LEN: usize = 8 + 32 + 8;
}
