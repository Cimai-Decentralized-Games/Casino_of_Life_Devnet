use anchor_lang::prelude::*;

#[account]
pub struct SaveState {
    pub game_session: Pubkey,
    pub sequence: u64,
    pub hash: [u8; 32],
    pub timestamp: i64,
    pub player1_health: u8,
    pub player2_health: u8,
    pub round_number: u8,
    pub player1_score: u32,
    pub player2_score: u32,
    pub game_clock: u32,  // Time elapsed in the current round
}