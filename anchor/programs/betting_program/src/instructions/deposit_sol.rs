use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, MintTo};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use structural_convert::StructuralConvert;

#[derive(Accounts, StructuralConvert)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
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
        associated_token::mint = dumbs_mint,
        associated_token::authority = depositor
    )]
    pub user_dumbs_account: Account<'info, TokenAccount>,
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

pub fn handler(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
    let betting_state = &ctx.accounts.betting_state;
    let sol_vault = &ctx.accounts.sol_vault;

    if amount < betting_state.min_deposit {
        return Err(ErrorCode::DepositTooSmall.into());
    }

    // Calculate deposit fee
    let fee = amount.checked_mul(betting_state.deposit_fee).unwrap() / 10000;
    let deposit_amount = amount.checked_sub(fee).unwrap();

    // Transfer full amount of SOL to vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.depositor.to_account_info(),
            to: ctx.accounts.sol_vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Update SolVault balance
    ctx.accounts.sol_vault.balance = sol_vault.balance.checked_add(amount).ok_or(ErrorCode::CalculationOverflow)?;

    // Transfer fee to Treasury
    ctx.accounts.sol_vault.transfer_to_treasury(fee)?;
    ctx.accounts.treasury.receive_from_sol_vault(fee);
    ctx.accounts.treasury.collect_bet_fee(fee);

    // Calculate DUMBS to mint
    let dumbs_to_mint = deposit_amount
        .checked_mul(betting_state.exchange_rate)
        .ok_or(ErrorCode::CalculationOverflow)?;

    // Mint DUMBS tokens
    let seeds = &[b"betting_state".as_ref(), &[ctx.bumps.betting_state]];
    let signer = &[&seeds[..]];
    let cpi_accounts = MintTo {
        mint: ctx.accounts.dumbs_mint.to_account_info(),
        to: ctx.accounts.user_dumbs_account.to_account_info(),
        authority: ctx.accounts.betting_state.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    token::mint_to(cpi_ctx, dumbs_to_mint)?;

    // Update betting state
    let betting_state = &mut ctx.accounts.betting_state;
    betting_state.total_sol_reserve = betting_state.total_sol_reserve.checked_add(deposit_amount).ok_or(ErrorCode::CalculationOverflow)?;
    betting_state.total_dumbs_in_circulation = betting_state.total_dumbs_in_circulation.checked_add(dumbs_to_mint).ok_or(ErrorCode::CalculationOverflow)?;

    Ok(())
}