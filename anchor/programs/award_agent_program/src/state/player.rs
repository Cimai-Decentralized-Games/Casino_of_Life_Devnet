use anchor_lang::prelude::*;

#[account]
pub struct Player {
    pub health: u8,
    pub wins: u64,
    pub losses: u64,
    pub enemies_killed: u64,
    pub last_kill_timestamp: i64,
    pub last_heal_timestamp: i64,
    pub last_battle_timestamp: i64,
    // ... other fields ...
}