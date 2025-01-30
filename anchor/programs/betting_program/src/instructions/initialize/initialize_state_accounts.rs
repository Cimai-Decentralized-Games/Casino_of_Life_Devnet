// initialize_state_accounts.rs
use anchor_lang::prelude::*;
use crate::state::*;
use anchor_spl::{
    token_2022::{self, Token2022},
    associated_token::AssociatedToken,
    token_interface::{Mint as MintInterface, TokenAccount},
};


#[derive(Accounts)]
#[instruction()]
pub struct InitializeStateAccounts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump
     )]
    pub betting_state: Account<'info, BettingState>,

    /// CHECK: This account is initialized as a Token-2022 mint
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump,
        mint::authority = betting_state,
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = dumbs_mint,
        associated_token::authority = authority,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: RAPR mint will be validated in RAPR-specific operations
    pub rapr_mint: AccountInfo<'info>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeStateAccounts>,) -> Result<()> {
    msg!("Initializing state accounts");
    
     // Initialize betting state
    let betting_state = &mut ctx.accounts.betting_state;
    betting_state.authority = ctx.accounts.authority.key();
    betting_state.dumbs_mint = ctx.accounts.dumbs_mint.key();
    betting_state.rapr_mint = ctx.accounts.rapr_mint.key();
    betting_state.house_fee = 250;
    betting_state.rapr_multiplier = 1000;
    betting_state.sol_dumbs_rate = 1000;
    betting_state.sol_rapr_rate = 10_000_000;
    betting_state.max_bet = 100_000_000_000;
    betting_state.is_paused = false;
    betting_state.bump = ctx.bumps.betting_state;

    msg!("Dumbs mint address: {}", ctx.accounts.dumbs_mint.key());
    Ok(())
}