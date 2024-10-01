use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeBetVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        seeds = [b"bet_vault", betting_state.key().as_ref()],
        bump,
        token::mint = dumbs_mint,
        token::authority = betting_state,
    )]
    pub bet_vault: Account<'info, TokenAccount>,
    
    pub dumbs_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        seeds = [b"betting_state"],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeBetVault>) -> Result<()> {
    let betting_state = &mut ctx.accounts.betting_state;
    betting_state.bet_vault = ctx.accounts.bet_vault.key();
    Ok(())
}