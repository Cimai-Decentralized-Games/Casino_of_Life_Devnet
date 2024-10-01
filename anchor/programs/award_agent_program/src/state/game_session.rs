use anchor_lang::prelude::*;

#[account]
pub struct GameSession {
    pub authority: Pubkey,
    pub current_save_state_sequence: u64,
    // Add other relevant fields
}