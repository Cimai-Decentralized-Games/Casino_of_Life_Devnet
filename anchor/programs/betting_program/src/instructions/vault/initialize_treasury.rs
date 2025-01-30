use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = Treasury::LEN,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub betting_state: Account<'info, BettingState>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeTreasury>) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;

    // Initialize single treasury for all fee collection
    treasury.initialize(
        ctx.accounts.authority.key(),
        ctx.bumps.treasury,
    );

    msg!("Treasury initialized");
    Ok(())
}