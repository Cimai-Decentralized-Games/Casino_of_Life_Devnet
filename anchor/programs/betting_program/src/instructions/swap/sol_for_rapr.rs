use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface};
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
#[instruction(sol_amount: u64)]
pub struct SwapSolForRapr<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: Token-2022 account for user's RAPR tokens
    #[account(
        mut,
        constraint = user_rapr_account.key() != betting_state.rapr_vault @ ErrorCode::InvalidAccount
    )]
    pub user_rapr_account: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"sol_vault"],
        bump,
        constraint = sol_vault.authority == betting_state.authority @ ErrorCode::Unauthorized
    )]
    pub sol_vault: Account<'info, SolVault>,

    /// CHECK: Token-2022 mint for RAPR tokens
    #[account(
        constraint = rapr_mint.key() == betting_state.rapr_mint @ ErrorCode::InvalidMint
    )]
    pub rapr_mint: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"betting_state"],
        bump,
        constraint = !betting_state.is_paused @ ErrorCode::ProgramPaused
    )]
    pub betting_state: Account<'info, BettingState>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<SwapSolForRapr>, sol_amount: u64) -> Result<()> {
    // Verify swap amount is within limits
    require!(
        sol_amount >= ctx.accounts.sol_vault.min_deposit_amount,
        ErrorCode::AmountTooSmall
    );
    require!(
        sol_amount <= ctx.accounts.sol_vault.max_deposit_amount,
        ErrorCode::AmountTooLarge
    );

    // Calculate RAPR tokens to mint based on rate
    let rapr_amount = sol_amount
        .checked_mul(ctx.accounts.betting_state.sol_rapr_rate)
        .ok_or(ErrorCode::CalculationOverflow)?;

    // Transfer SOL from user to vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.sol_vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, sol_amount)?;

    // Update sol vault stats
    ctx.accounts.sol_vault.process_deposit(sol_amount)?;

    // Mint RAPR to user using Token-2022
    let betting_state_seeds = &[
        b"betting_state".as_ref(),
        &[ctx.bumps.betting_state],
    ];
    let betting_state_signer = &[&betting_state_seeds[..]];

    let mint_accounts = token_2022::MintTo {
        mint: ctx.accounts.rapr_mint.to_account_info(),
        to: ctx.accounts.user_rapr_account.to_account_info(),
        authority: ctx.accounts.betting_state.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        mint_accounts,
        betting_state_signer,
    );
    token_2022::mint_to(cpi_ctx, rapr_amount)?;

    msg!(
        "Swapped {} SOL for {} RAPR tokens",
        sol_amount,
        rapr_amount
    );

    Ok(())
}