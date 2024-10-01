use anchor_lang::prelude::*;
use structural_convert::StructuralConvert;
use static_assertions::const_assert_eq;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum FightOutcome {
    Fighter1Wins,
    Fighter2Wins,
    Draw,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum BetType {
    WinnerPrediction,
    RoundPrediction,
    MethodOfVictory,
}

#[account]
#[derive(StructuralConvert)]
pub struct BettingState {
    pub authority: Pubkey,
    pub sol_vault: Pubkey,
    pub dumbs_mint: Pubkey,
    pub bet_vault: Pubkey,
    pub treasury: Pubkey,
    pub exchange_rate: u64,  // 1000 (1 SOL = 1000 DUMBS)
    pub min_deposit: u64,    // 1_000_000_000 (1 SOL in lamports)
    pub max_bet: u64,        // 100_000_000_000 (100 DUMBS in smallest unit)
    pub house_fee: u64,      // 50 (0.5%)
    pub deposit_fee: u64,    // 100 (1%)
    pub cashout_fee: u64,    // 200 (2%)
    pub total_sol_reserve: u64,
    pub total_dumbs_in_circulation: u64,
    pub total_potential_payout: u64,
}

impl BettingState {
    pub const LEN: usize = std::mem::size_of::<Self>();
}

#[account]
#[derive(StructuralConvert)]
pub struct UserAccount {
    pub authority: Pubkey,
    pub sol_balance: u64,
    pub dumbs_balance: u64,
}

impl UserAccount {
    pub const LEN: usize = 32 + 8 + 8;
}

#[account]
#[derive(StructuralConvert)]
pub struct FightEpoch {
    pub epoch_id: u32,
    pub fight_id: String,
    pub start_time: i64,
    pub end_time: i64,
    pub total_bets: u64,
    pub total_dumbs_bet: u64,
}

#[account]
#[derive(StructuralConvert)]
pub struct Bet {
    pub bettor: Pubkey,
    pub amount: u64,
    pub fight_id: u64,
    pub odds: u64,
    pub timestamp: i64,
    pub settled: bool,
}

impl Bet {
    pub const LEN: usize = std::mem::size_of::<Self>();
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeBumps {
    pub betting_state: u8,
    pub sol_vault: u8,
    pub dumbs_mint: u8,
    pub bet_vault: u8,
    pub treasury: u8,
}
