use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeSolVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + SolVault::LEN,
        seeds = [b"sol_vault"],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,
    
    #[account(
        mut,
        seeds = [b"betting_state"],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeSolVault>) -> Result<()> {
    let sol_vault = &mut ctx.accounts.sol_vault;
    let betting_state = &ctx.accounts.betting_state;

    // Initialize the SolVault
    sol_vault.balance = 0;
    sol_vault.authority = betting_state.authority;

    msg!("SolVault initialized with balance 0 and authority: {:?}", sol_vault.authority);

    Ok(())
}