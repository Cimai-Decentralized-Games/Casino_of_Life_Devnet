use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Burn};
use crate::state::*;
use structural_convert::StructuralConvert;

#[derive(Accounts, StructuralConvert)]
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
}

pub fn handler(ctx: Context<CashOut>, amount: u64) -> Result<()> {
    let betting_state = &mut ctx.accounts.betting_state;
    let treasury = &mut ctx.accounts.treasury;
    let sol_vault = &mut ctx.accounts.sol_vault;

    // Calculate cashout fee
    let fee = amount.checked_mul(betting_state.cashout_fee).unwrap() / 10000;
    let cashout_amount = amount.checked_sub(fee).unwrap();

    // Calculate SOL amount
    let sol_amount = cashout_amount.checked_mul(1_000_000_000).unwrap() / betting_state.exchange_rate;

    // Burn DUMBS tokens
    let cpi_accounts = Burn {
        mint: ctx.accounts.dumbs_mint.to_account_info(),
        from: ctx.accounts.user_dumbs_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::burn(cpi_ctx, amount)?;

    // Transfer SOL from vault to user
    let sol_vault_bump = ctx.bumps.sol_vault;
    let seeds = &[
        b"sol_vault".as_ref(),
        &[sol_vault_bump],
    ];
    let signer = &[&seeds[..]];
    let cpi_accounts = anchor_lang::system_program::Transfer {
        from: sol_vault.to_account_info(),
        to: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.system_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    anchor_lang::system_program::transfer(cpi_ctx, sol_amount)?;

    // Update state
    sol_vault.balance = sol_vault.balance.checked_sub(sol_amount).unwrap();
    betting_state.total_sol_reserve = betting_state.total_sol_reserve.checked_sub(sol_amount).unwrap();
    betting_state.total_dumbs_in_circulation = betting_state.total_dumbs_in_circulation.checked_sub(amount).unwrap();

    // Update treasury
    treasury.collect_bet_fee(fee);

    Ok(())
}