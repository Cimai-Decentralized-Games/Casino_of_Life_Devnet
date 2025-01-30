use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface};
use crate::state::*;
use crate::TOKEN_2022_PROGRAM_ID;


#[derive(Accounts)]
pub struct InitializeBetVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Token-2022 account being initialized
    #[account(
        init,
        payer = authority,
        seeds = [b"bet_vault"],
        space = 165,  // Token2022 account size
        bump,
        owner = TOKEN_2022_PROGRAM_ID
    )]
    pub bet_vault: AccountInfo<'info>,

    /// CHECK: The Token-2022 mint we want to hold
    #[account(
        constraint = dumbs_mint.key() == betting_state.dumbs_mint
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface >,

    #[account(mut)]
    pub betting_state: Account<'info, BettingState>,
    
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeBetVault>) -> Result<()> {
    // Store the bump in betting_state
    ctx.accounts.betting_state.bet_vault_bump = ctx.bumps.bet_vault;

    // Initialize the token account using CPI
    token_2022::initialize_account3(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::InitializeAccount3 {
                account: ctx.accounts.bet_vault.to_account_info(),
                mint: ctx.accounts.dumbs_mint.to_account_info(),
                authority: ctx.accounts.token_program.to_account_info(), 
            }
        )
    )?;
    
    ctx.accounts.betting_state.bet_vault = ctx.accounts.bet_vault.key();
    Ok(())
}