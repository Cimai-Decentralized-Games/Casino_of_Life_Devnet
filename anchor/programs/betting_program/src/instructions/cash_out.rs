use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Burn};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use structural_convert::StructuralConvert;

#[derive(Accounts, StructuralConvert)]
#[instruction(fight_id: u64)]
pub struct CashOut<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = user
    )]
    pub user_dumbs_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"bet", user.key().as_ref(), &fight_id.to_le_bytes()],
        bump,
        constraint = bet.bettor == user.key() @ ErrorCode::InvalidAccount,
        constraint = bet.settled @ ErrorCode::BetNotSettled
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        mut,
        seeds = [b"sol_vault"],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump
    )]
    pub dumbs_mint: Account<'info, token::Mint>,
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
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    #[account(
        mut,
        seeds = [b"bet_vault", betting_state.key().as_ref()],
        bump,
        token::mint = dumbs_mint,
        token::authority = betting_state,
    )]
    pub bet_vault: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<CashOut>, fight_id: u64) -> Result<()> {
    // First do all the calculations that need mutable access
    let winnings = {
        let bet = &ctx.accounts.bet;
        bet.amount.checked_mul(bet.odds)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationOverflow)?
    };

    let (fee, cashout_amount, sol_amount) = {
        let betting_state = &ctx.accounts.betting_state;
        
        let fee = winnings.checked_mul(betting_state.cashout_fee)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(10000)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        let cashout_amount = winnings.checked_sub(fee)
            .ok_or(ErrorCode::CalculationOverflow)?;

        let sol_amount = cashout_amount
            .checked_div(betting_state.exchange_rate)
            .ok_or(ErrorCode::CalculationOverflow)?;

        (fee, cashout_amount, sol_amount)
    };

    // Verify sol_vault has enough funds
    require!(
        ctx.accounts.sol_vault.balance >= sol_amount,
        ErrorCode::InsufficientSolVaultFunds
    );

    // Burn tokens from bet vault
    let betting_state_bump = ctx.bumps.betting_state;
    let betting_state_seeds = &[
        b"betting_state".as_ref(),
        &[betting_state_bump],
    ];
    let betting_state_signer = &[&betting_state_seeds[..]];

    let cpi_accounts = Burn {
        mint: ctx.accounts.dumbs_mint.to_account_info(),
        from: ctx.accounts.bet_vault.to_account_info(),
        authority: ctx.accounts.betting_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(
        cpi_program, 
        cpi_accounts,
        betting_state_signer
    );
    token::burn(cpi_ctx, winnings)?;

    // Transfer SOL
    let sol_vault_bump = ctx.bumps.sol_vault;
    let seeds = &[
        b"sol_vault".as_ref(),
        &[sol_vault_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: ctx.accounts.sol_vault.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    anchor_lang::system_program::transfer(cpi_ctx, sol_amount)?;

    // Update all state at the end
    {
        let betting_state = &mut ctx.accounts.betting_state;
        betting_state.total_sol_reserve = betting_state.total_sol_reserve
            .checked_sub(sol_amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        betting_state.total_dumbs_in_circulation = betting_state.total_dumbs_in_circulation
            .checked_sub(winnings)
            .ok_or(ErrorCode::CalculationOverflow)?;
    }

    // Update sol vault balance
    let sol_vault = &mut ctx.accounts.sol_vault;
    sol_vault.balance = sol_vault.balance
        .checked_sub(sol_amount)
        .ok_or(ErrorCode::CalculationOverflow)?;

    // Update treasury
    let treasury = &mut ctx.accounts.treasury;
    treasury.collect_bet_fee(fee);

    Ok(())
}