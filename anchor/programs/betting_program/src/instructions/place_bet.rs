use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use structural_convert::StructuralConvert;

#[derive(Accounts)]
#[instruction(amount: u64, fight_id: u64, odds: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = bettor
    )]
    pub user_dumbs_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"bet_vault", betting_state.key().as_ref()],
        bump,
        token::mint = dumbs_mint,
        token::authority = betting_state,
    )]
    pub bet_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [DUMBS_TREASURY_SEED],
        bump
    )]
    pub dumbs_treasury: Account<'info, DumbsTreasury>,

    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = dumbs_treasury
    )]
    pub dumbs_treasury_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = bettor,
        space = 8 + Bet::LEN,
        seeds = [b"bet", bettor.key().as_ref(), &fight_id.to_le_bytes()],
        bump
    )]
    pub bet: Account<'info, Bet>,

    #[account(
        mut,
        seeds = [b"betting_state"],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,

    pub dumbs_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<PlaceBet>, amount: u64, fight_id: u64, odds: u64) -> Result<()> {
    let betting_state = &mut ctx.accounts.betting_state;
    let bet_vault = &ctx.accounts.bet_vault;

    if amount > betting_state.max_bet {
        return Err(ErrorCode::BetTooLarge.into());
    }

    // Check if user has enough DUMBS tokens
    if ctx.accounts.user_dumbs_account.amount < amount {
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // Calculate and deduct house fee (in DUMBS)
    let fee = amount.checked_mul(betting_state.house_fee).unwrap() / 10000;
    let bet_amount = amount.checked_sub(fee).unwrap();

    // Transfer DUMBS tokens from user to bet vault
    let betting_state_bump = ctx.bumps.betting_state;
    let betting_state_seeds = &[
        b"betting_state".as_ref(),
        &[betting_state_bump],
    ];
    let betting_state_signer = &[&betting_state_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.user_dumbs_account.to_account_info(),
        to: bet_vault.to_account_info(),
        authority: ctx.accounts.bettor.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program.clone(), 
        cpi_accounts,
        betting_state_signer
    );
    token::transfer(cpi_ctx, bet_amount)?;

    // Transfer fee to DUMBS treasury account
    let fee_transfer = Transfer {
        from: ctx.accounts.user_dumbs_account.to_account_info(),
        to: ctx.accounts.dumbs_treasury_account.to_account_info(),
        authority: ctx.accounts.bettor.to_account_info(),
    };
    let fee_cpi_ctx = CpiContext::new_with_signer(
        cpi_program, 
        fee_transfer,
        betting_state_signer
    );
    token::transfer(fee_cpi_ctx, fee)?;

    // Update the treasury records
    let treasury = &mut ctx.accounts.treasury;
    treasury.collect_bet_fee(fee);

    let dumbs_treasury = &mut ctx.accounts.dumbs_treasury;
    dumbs_treasury.collect_fee(fee);

    // Create a new bet record
    let bet = &mut ctx.accounts.bet;
    bet.bettor = ctx.accounts.bettor.key();
    bet.amount = bet_amount;
    bet.fight_id = fight_id;
    bet.odds = odds;
    bet.timestamp = Clock::get()?.unix_timestamp;
    bet.settled = false;

    // Update betting state
    let potential_payout = bet_amount.checked_mul(odds).unwrap() / 100;
    betting_state.total_potential_payout = betting_state.total_potential_payout
        .checked_add(potential_payout)
        .ok_or(ErrorCode::CalculationOverflow)?;
    betting_state.total_dumbs_in_circulation = betting_state.total_dumbs_in_circulation
        .checked_add(bet_amount)
        .ok_or(ErrorCode::CalculationOverflow)?;

    Ok(())
}