// cash_out.rs
use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface};
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
#[instruction(amount: u64, token_type: TokenType)]
pub struct CashOut<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_BETTING_ACCOUNT_SEED, user.key().as_ref()],
        bump,
        constraint = user_betting_account.owner == user.key() @ ErrorCode::InvalidAccount
    )]
    pub user_betting_account: Account<'info, UserBettingAccount>,

    #[account(
        mut,
        constraint = user_dumbs_account.owner == user.key() @ ErrorCode::InvalidAccount
    )]
    pub user_dumbs_account: InterfaceAccount<'info, TokenAccountInterface>,
    
    #[account(
        mut,
        constraint = user_rapr_account.owner == user.key() @ ErrorCode::InvalidAccount
    )]
    pub user_rapr_account: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"sol_vault"],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,

    #[account(
        mut,
        seeds = [b"bet_vault"],
        bump
    )]
    pub bet_vault_dumbs: InterfaceAccount<'info, TokenAccountInterface>,
    
    #[account(
        mut,
        seeds = [b"rapr_vault"],
        bump,
        constraint = bet_vault_rapr.key() == betting_state.rapr_vault @ ErrorCode::InvalidAccount
    )]
    pub bet_vault_rapr: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"betting_state"],
        bump,
        constraint = betting_state.is_initialized() @ ErrorCode::NotInitialized
    )]
    pub betting_state: Account<'info, BettingState>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(mut ctx: Context<CashOut>, amount: u64, token_type: TokenType) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    let (fee, cashout_amount) = {
        let fee = ctx.accounts.betting_state.calculate_fee(amount)?;
        let cashout = amount.checked_sub(fee).ok_or(ErrorCode::CalculationOverflow)?;
        (fee, cashout)
    };

    // Create longer-lived value for the seeds
    let vault_bump = ctx.bumps.sol_vault;
    let seeds = [b"sol_vault".as_ref(), &[vault_bump]];
    let sol_vault_signer = &[&seeds[..]];

    match token_type {
        TokenType::DUMBS => handle_dumbs_cashout(
            &mut ctx,
            amount,
            cashout_amount,
            sol_vault_signer
        )?,
        TokenType::RAPR => handle_rapr_cashout(
            &mut ctx,
            amount,
            cashout_amount,
            sol_vault_signer
        )?,
    }

    ctx.accounts.treasury.collect_deposit_fee(fee)?;
    Ok(())
}

#[inline(always)]
fn handle_dumbs_cashout<'info>(
    ctx: &mut Context<CashOut<'info>>,
    amount: u64,
    cashout_amount: u64,
    sol_vault_signer: &[&[&[u8]]],
) -> Result<()> {
    let sol_return = cashout_amount
        .checked_div(ctx.accounts.betting_state.sol_dumbs_rate)
        .ok_or(ErrorCode::CalculationOverflow)?;

    require!(
        ctx.accounts.sol_vault.balance >= sol_return,
        ErrorCode::InsufficientSolBalance
    );

    token_2022::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::Burn {
                mint: ctx.accounts.dumbs_mint.to_account_info(),
                from: ctx.accounts.user_dumbs_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount
    )?;

    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            sol_vault_signer,
        ),
        sol_return
    )?;

    ctx.accounts.sol_vault.balance = ctx.accounts.sol_vault.balance
        .checked_sub(sol_return)
        .ok_or(ErrorCode::CalculationOverflow)?;

    Ok(())
}

#[inline(always)]
fn handle_rapr_cashout<'info>(
    ctx: &mut Context<CashOut<'info>>,
    amount: u64,
    cashout_amount: u64,
    sol_vault_signer: &[&[&[u8]]],
) -> Result<()> {
    token_2022::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token_2022::Transfer {
                from: ctx.accounts.user_rapr_account.to_account_info(),
                to: ctx.accounts.bet_vault_rapr.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount
    )?;

    let sol_return = cashout_amount
        .checked_mul(ctx.accounts.betting_state.sol_rapr_rate)
        .ok_or(ErrorCode::CalculationOverflow)?;

    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            sol_vault_signer,
        ),
        sol_return
    )?;

    Ok(())
}