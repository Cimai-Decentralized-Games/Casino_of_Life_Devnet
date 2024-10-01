use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Burn};
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        constraint = user_account.authority == user.key() @ ErrorCode::Unauthorized
    )]
    pub user_account: Account<'info, UserAccount>,
    #[account(
        mut,
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
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = user
    )]
    pub user_dumbs_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump
    )]
    pub dumbs_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let user = &ctx.accounts.user;
    let user_account = &mut ctx.accounts.user_account;
    let sol_vault = &mut ctx.accounts.sol_vault;
    let betting_state = &mut ctx.accounts.betting_state;
    let treasury = &mut ctx.accounts.treasury;

    // Check if user has sufficient DUMBS balance
    let dumbs_balance = ctx.accounts.user_dumbs_account.amount;
    let sol_equivalent = dumbs_balance
        .checked_mul(1_000_000_000)
        .ok_or(ErrorCode::CalculationOverflow)?
        .checked_div(betting_state.exchange_rate)
        .ok_or(ErrorCode::CalculationOverflow)?;

    if sol_equivalent < amount {
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // Calculate withdrawal fee
    let fee = amount
        .checked_mul(betting_state.cashout_fee)
        .ok_or(ErrorCode::CalculationOverflow)?
        .checked_div(10000)
        .ok_or(ErrorCode::CalculationOverflow)?;
    let withdrawal_amount = amount.checked_sub(fee).ok_or(ErrorCode::CalculationOverflow)?;

    // Calculate DUMBS to burn
    let dumbs_to_burn = amount
        .checked_mul(betting_state.exchange_rate)
        .ok_or(ErrorCode::CalculationOverflow)?
        .checked_div(1_000_000_000)
        .ok_or(ErrorCode::CalculationOverflow)?;

    // Burn DUMBS tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.dumbs_mint.to_account_info(),
        from: ctx.accounts.user_dumbs_account.to_account_info(),
        authority: user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, dumbs_to_burn)?;

    // Transfer SOL from vault to user
    let sol_vault_bump = ctx.bumps.sol_vault;
    let seeds = &[b"sol_vault".as_ref(), &[sol_vault_bump]];
    let signer = &[&seeds[..]];
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: sol_vault.to_account_info(),
        to: user.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    anchor_lang::system_program::transfer(cpi_ctx, withdrawal_amount)?;

    // Update SolVault balance
    sol_vault.balance = sol_vault.balance.checked_sub(amount).ok_or(ErrorCode::CalculationOverflow)?;

    // Transfer fee to Treasury
    sol_vault.transfer_to_treasury(fee)?;
    treasury.receive_from_sol_vault(fee);
    treasury.collect_bet_fee(fee);

    // Update betting state
    betting_state.total_sol_reserve = betting_state.total_sol_reserve.checked_sub(withdrawal_amount).ok_or(ErrorCode::CalculationOverflow)?;
    betting_state.total_dumbs_in_circulation = betting_state.total_dumbs_in_circulation.checked_sub(dumbs_to_burn).ok_or(ErrorCode::CalculationOverflow)?;

    msg!("Withdrawn {} SOL (fee: {} SOL)", withdrawal_amount, fee);

    Ok(())
}