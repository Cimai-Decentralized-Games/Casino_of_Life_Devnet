use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface};

use crate::state::*;
use crate::errors::error_code::ErrorCode;

const DUMBS_MINT_SEED: &[u8] = b"dumbs_mint";

#[derive(Accounts)]
#[instruction(secure_fight_id: u64)]
pub struct MintDumbsForWin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_BETTING_ACCOUNT_SEED, bettor.key().as_ref()],
        bump,
        constraint = user_betting_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_betting_account: Account<'info, UserBettingAccount>,

    /// CHECK: User account to mint to
    pub bettor: SystemAccount<'info>,

    /// CHECK: Token-2022 account for user's DUMBS tokens
    #[account(
        mut,
        constraint = user_dumbs_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_dumbs_account: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: Token-2022 vault for RAPR tokens
    #[account(
        mut,
        seeds = [b"rapr_vault"],
        bump
    )]
    pub rapr_vault: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: Token-2022 mint for DUMBS tokens
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,

    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump,
        constraint = betting_state.is_initialized() @ ErrorCode::NotInitialized
    )]
    pub betting_state: Account<'info, BettingState>,

    pub token2022_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintDumbsForWin>, secure_fight_id: u64) -> Result<()> {
    let user_account = &mut ctx.accounts.user_betting_account;
    let bettor = ctx.accounts.bettor.key();

    // Check if there is an active bet
    let bet = user_account
        .active_bet
        .as_mut()
        .ok_or(ErrorCode::BetNotFound)?;

    // Ensure the bet matches the fight_id and bettor
    require!(
        bet.fight_id == secure_fight_id as u32 && bet.bettor == bettor,
        ErrorCode::InvalidBettor
    );

    // Check if bet was already settled
    require!(!bet.settled, ErrorCode::BetAlreadySettled);

    // Calculate payout amount for DUMBS and update stats
    let dumbs_to_mint = ctx
        .accounts
        .betting_state
        .mint_dumbs_for_win(bet.potential_payout, bet.token_type)?;

    // Mint DUMBS tokens to the user
    let seeds = DUMBS_MINT_SEED;
    let dumbs_mint_bump = ctx.bumps.dumbs_mint; // Access the bump value directly
    let signer_seeds: &[&[&[u8]]] = &[&[seeds, &[dumbs_mint_bump]]];

    let mint_ctx = CpiContext::new_with_signer(
        ctx.accounts.token2022_program.to_account_info(),
        token_2022::MintTo {
            mint: ctx.accounts.dumbs_mint.to_account_info(),
            to: ctx.accounts.user_dumbs_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
        signer_seeds,
    );
    token_2022::mint_to(mint_ctx, dumbs_to_mint as u64)?;

    // Settle the bet
    bet.settle(true)?;
    bet.won = true;
    bet.actual_payout = dumbs_to_mint;

    // Remove the active bet
    user_account.remove_active_bet()?;

    // Update user winnings
    user_account.update_winnings(dumbs_to_mint as u64)?;

    msg!(
        "Minted {} DUMBS tokens to {}",
        dumbs_to_mint,
        ctx.accounts.bettor.key()
    );
    Ok(())
}