use anchor_lang::prelude::*;

#[account]
pub struct Agent {
    pub name: String,
    pub owner: Pubkey,
    pub bump: u8,
    pub nft_mint: Pubkey,
    pub wins: u64,
    pub losses: u64,
    pub enemies_killed: u64,
    // ... other fields ...
}