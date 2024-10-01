use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::betting_state::BettingState;
use structural_convert::StructuralConvert;
use std::convert::TryFrom;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeParams {
    pub exchange_rate: u64,
    pub min_deposit: u64,
    pub max_bet: u64,
    pub house_fee: u64,
    pub deposit_fee: u64,
    pub cashout_fee: u64,
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + BettingState::LEN,
        seeds = [b"betting_state"],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>, params: InitializeParams) -> Result<()> {
    let betting_state = &mut ctx.accounts.betting_state;
    betting_state.authority = ctx.accounts.authority.key();
    betting_state.exchange_rate = params.exchange_rate;
    betting_state.min_deposit = params.min_deposit;
    betting_state.max_bet = params.max_bet;
    betting_state.house_fee = params.house_fee;
    betting_state.deposit_fee = params.deposit_fee;
    betting_state.cashout_fee = params.cashout_fee;
    betting_state.total_sol_reserve = 0;
    betting_state.total_dumbs_in_circulation = 0;
    betting_state.total_potential_payout = 0;

    Ok(())
}