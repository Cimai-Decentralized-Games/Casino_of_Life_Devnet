use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
pub struct InitializeSolVault<'info> {
    #[account(
        mut,
        constraint = authority.key() == betting_state.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = SolVault::LEN,
        seeds = [SOL_VAULT_SEED],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,
    
    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub betting_state: Account<'info, BettingState>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeSolVault>
) -> Result<()> {
    let sol_vault = &mut ctx.accounts.sol_vault;
    let betting_state = &ctx.accounts.betting_state;

    // Initialize the SolVault with default values
    sol_vault.initialize(
        betting_state.authority,
        10_000_000,              // 0.01 SOL minimum deposit
        100_000_000_000,         // 100 SOL maximum deposit
        ctx.bumps.sol_vault,
    );

    msg!(
        "SOL Vault initialized with authority: {:?}, min: {}, max: {}",
        sol_vault.authority,
        sol_vault.min_deposit_amount,
        sol_vault.max_deposit_amount
    );

    Ok(())
}