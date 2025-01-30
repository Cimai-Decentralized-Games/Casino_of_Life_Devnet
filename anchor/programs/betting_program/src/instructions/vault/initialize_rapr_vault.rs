use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface};
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeRaprVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Token-2022 account being initialized
    #[account(
        init,
        payer = authority,
        seeds = [b"rapr_vault"],
        space = 165,
        bump,
        owner = token_2022::ID
    )]
    pub rapr_vault: AccountInfo<'info>,

    /// CHECK: The Token-2022 mint we want to hold
    pub rapr_mint: AccountInfo<'info>,

    #[account(mut)]
    pub betting_state: Account<'info, BettingState>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeRaprVault>) -> Result<()> {
    ctx.accounts.betting_state.rapr_vault_bump = ctx.bumps.rapr_vault;

    token_2022::initialize_account3(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::InitializeAccount3 {
                account: ctx.accounts.rapr_vault.to_account_info(),
                mint: ctx.accounts.rapr_mint.to_account_info(),
                authority: ctx.accounts.betting_state.to_account_info(),
            }
        )
    )?;
    
    ctx.accounts.betting_state.rapr_vault = ctx.accounts.rapr_vault.key();
    Ok(())
}