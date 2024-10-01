use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint};
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeDumbsMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        seeds = [b"dumbs_mint"],
        bump,
        mint::decimals = 9,
        mint::authority = betting_state,
    )]
    pub dumbs_mint: Account<'info, Mint>,
    #[account(
        seeds = [b"betting_state"],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(_ctx: Context<InitializeDumbsMint>) -> Result<()> {
// The mint is initialized automatically by the init attribute
Ok(())
}
