use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::{self, Token2022},
};
use crate::state::*;

#[derive(Accounts)]
#[instruction()]
pub struct InitializeBettingState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,

    /// CHECK: Will be initialized in vault instructions
    #[account(
        seeds = [b"bet_vault"],
        bump,
    )]
    pub bet_vault: AccountInfo<'info>,

    /// CHECK: Will be initialized in vault instructions
    #[account(
        seeds = [b"rapr_vault"],
        bump,
    )]
    pub rapr_vault: AccountInfo<'info>,

    /// CHECK: Will be initialized in vault instructions
    #[account(
        seeds = [b"treasury"],
        bump,
    )]
    pub treasury: AccountInfo<'info>,

    /// CHECK: Will be initialized in vault instructions
    #[account(
        seeds = [b"sol_vault"],
        bump,
    )]
    pub sol_vault: AccountInfo<'info>,
}

pub fn handler(
    ctx: Context<InitializeBettingState>,
) -> Result<()> {
    msg!("Starting initialization...");
    msg!("Betting State Address: {}", ctx.accounts.betting_state.key());

    // Get the mutable betting_state
    let  betting_state = &mut ctx.accounts.betting_state;

    // Initialize betting state
    betting_state.bet_vault = ctx.accounts.bet_vault.key();
    betting_state.rapr_vault = ctx.accounts.rapr_vault.key();
    betting_state.treasury = ctx.accounts.treasury.key();
    betting_state.sol_vault = ctx.accounts.sol_vault.key();

    Ok(())
}