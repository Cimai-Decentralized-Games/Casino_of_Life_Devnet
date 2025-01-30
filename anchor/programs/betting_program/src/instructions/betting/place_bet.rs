// place_bet.rs
use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use crate::state::bet::Bet;

#[derive(Accounts)]
#[instruction(amount: u64, fight_id: u64, odds: u64, token_type: TokenType)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        init_if_needed,
        payer = bettor,
        space = UserBettingAccount::LEN,
        seeds = [USER_BETTING_ACCOUNT_SEED, bettor.key().as_ref()],
        bump,
        constraint = user_betting_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_betting_account: Account<'info, UserBettingAccount>,

    #[account(
        mut,
        constraint = user_dumbs_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_dumbs_account: InterfaceAccount<'info, TokenAccountInterface>,
    
    #[account(
        mut,
        constraint = user_rapr_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_rapr_account: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"bet_vault"],
        bump,
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

    /// CHECK: Token-2022 mint for DUMBS tokens
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<PlaceBet>, amount: u64, fight_id: u64, odds: u64, token_type: TokenType) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);
    require!(amount <= ctx.accounts.betting_state.max_bet, ErrorCode::BetTooLarge);

    let (fee, bet_amount) = {
        let fee = ctx.accounts.betting_state.calculate_fee(amount)?;
        (fee, amount.checked_sub(fee).ok_or(ErrorCode::CalculationOverflow)?)
    };

    let (adjusted_odds, potential_payout) = {
        let adj_odds = ctx.accounts.betting_state.calculate_odds(odds, token_type)?;
        let payout = bet_amount
            .checked_mul(adj_odds)
            .and_then(|p| p.checked_div(100))
            .ok_or(ErrorCode::CalculationOverflow)?;
        (adj_odds, payout)
    };

    // Perform token transfer based on token type
    let transfer_accounts = match token_type {
        TokenType::DUMBS => token_2022::Transfer {
            from: ctx.accounts.user_dumbs_account.to_account_info(),
            to: ctx.accounts.bet_vault_dumbs.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        },
        TokenType::RAPR => token_2022::Transfer {
            from: ctx.accounts.user_rapr_account.to_account_info(),
            to: ctx.accounts.bet_vault_rapr.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        },
    };
    
    token_2022::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), transfer_accounts),
        amount
    )?;

    // Access the bump directly from ctx.bumps
    let bump = ctx.bumps.user_betting_account;

    // Initialize and add bet
    let mut bet = Bet::default();
    bet.initialize(
        ctx.accounts.bettor.key(),
        token_type,
        bet_amount as u32,
        fee as u32,
        fight_id as u32,
        adjusted_odds as u16,
        if token_type == TokenType::RAPR { Some(ctx.accounts.betting_state.rapr_multiplier as u16) } else { None },
        bump,
    )?;

    // Update accounts
    ctx.accounts.user_betting_account.add_active_bet(bet)?;
    ctx.accounts.betting_state.total_potential_payout = ctx.accounts.betting_state
        .total_potential_payout
        .checked_add(potential_payout)
        .ok_or(ErrorCode::CalculationOverflow)?;
    ctx.accounts.treasury.collect_bet_fee(fee, token_type)?;
    ctx.accounts.user_betting_account.update_wagered_amount(bet_amount, token_type)?;

    Ok(())
}