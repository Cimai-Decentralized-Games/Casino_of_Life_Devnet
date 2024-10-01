use anchor_lang::prelude::*;

#[account]
pub struct Collection {
    pub collection_id: Pubkey,
    pub name: [u8; 32],
    pub symbol: [u8; 10],
    pub strategy: [u8; 10],
    pub authority: Pubkey,
}

impl Collection {
    pub const LEN: usize = 8 + // discriminator
        32 + // collection_id (Pubkey)
        32 + // name
        10 + // symbol
        10 + // strategy
        32; // authority (Pubkey)
}