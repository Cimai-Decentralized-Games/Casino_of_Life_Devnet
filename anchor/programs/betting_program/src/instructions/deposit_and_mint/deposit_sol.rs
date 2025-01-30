use anchor_lang::{prelude::*, system_program};
use anchor_spl::{
    token_2022::{self, Token2022},
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount},
};
use crate::state::*;
use crate::errors::ErrorCode;
pub const TOKEN_2022_PROGRAM_ID: Pubkey = solana_program::pubkey!("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
use spl_associated_token_account::instruction;

const BETTING_STATE_SEED: &[u8] = b"betting_state";


#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct DepositSol<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"sol_vault"],
        bump
    )]
    pub sol_vault: Account<'info, SolVault>,

    /// CHECK: Token-2022 vault for DUMBS tokens
    #[account(
        mut,
        seeds = [b"bet_vault"],
        bump,
        constraint = bet_vault_dumbs.key() == betting_state.bet_vault @ ErrorCode::InvalidAccount,
        constraint = {
            msg!("Bet Vault Dumbs Owner: {}", bet_vault_dumbs.owner);
            msg!("Expected Token-2022 Program ID: {}", TOKEN_2022_PROGRAM_ID);
            bet_vault_dumbs.owner == TOKEN_2022_PROGRAM_ID} @ ErrorCode::InvalidProgramId
        

    )]
    pub bet_vault_dumbs: Box<InterfaceAccount<'info, TokenAccount>>,  

    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    /// CHECK: Token-2022 mint for DUMBS tokens
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump,
        constraint = dumbs_mint.key() == betting_state.dumbs_mint @ ErrorCode::InvalidMint
    )]
    pub dumbs_mint: Box<InterfaceAccount<'info, Mint>>,  

    /// CHECK: Token-2022 account for user's DUMBS tokens
    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = depositor,
        associated_token::token_program = token_program,
    )]
    pub user_dumbs_account: Box<InterfaceAccount<'info, TokenAccount>>,  

    #[account(
        mut,
        seeds = [BETTING_STATE_SEED, depositor.key().as_ref()],
        bump,
        has_one = sol_vault,
        has_one = treasury,
    )]
    pub betting_state: Account<'info, BettingState>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
    msg!("Starting deposit with amount: {}", amount);

    // Debugging: Print owner and program ID
    msg!("bet_vault_dumbs owner: {:?}", ctx.accounts.bet_vault_dumbs.owner);

    // SOL transfer and other logic...
    Ok(())
}