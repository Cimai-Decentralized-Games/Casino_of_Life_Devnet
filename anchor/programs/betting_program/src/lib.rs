use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use anchor_lang::{AnchorDeserialize, AnchorSerialize};
use static_assertions::const_assert_eq;
use crate::instructions::initialize::{Initialize, InitializeParams};

extern crate structural_convert;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("5FwvYgAChMwMsBrmSKBBZeWRGX27p62G3o3UsBQjhVJZ");

#[program]
pub mod betting_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
        instructions::initialize::handler(ctx, params)
    }

    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::deposit_sol::handler(ctx, amount)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, fight_id: u64, odds: u64) -> Result<()> {
        instructions::place_bet::handler(ctx, amount, fight_id, odds)
    }

    pub fn settle_bet(ctx: Context<SettleBet>, fight_id: u64, winner: Pubkey) -> Result<()> {
        instructions::settle_bet::handler(ctx, fight_id, winner)
    }

    pub fn cash_out(ctx: Context<CashOut>, amount: u64) -> Result<()> {
        instructions::cash_out::handler(ctx, amount)
    }

    pub fn user_initialize(ctx: Context<InitializeUser>) -> Result<()> {
        instructions::user_initialize::handler(ctx)
    }

    pub fn initialize_dumbs_mint(ctx: Context<InitializeDumbsMint>) -> Result<()> {
        instructions::initialize_dumbs_mint::handler(ctx)
    }

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::handler(ctx)
    }

    pub fn initialize_dumbs_treasury(ctx: Context<InitializeDumbsTreasury>) -> Result<()> {
        instructions::initialize_dumbs_treasury::handler(ctx)
    }

    pub fn initialize_sol_vault(ctx: Context<InitializeSolVault>) -> Result<()> {
        instructions::initialize_sol_vault::handler(ctx)
    }

    pub fn initialize_bet_vault(ctx: Context<InitializeBetVault>) -> Result<()> {
        instructions::initialize_bet_vault::handler(ctx)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        instructions::withdraw_sol::handler(ctx, amount)
    }
}
