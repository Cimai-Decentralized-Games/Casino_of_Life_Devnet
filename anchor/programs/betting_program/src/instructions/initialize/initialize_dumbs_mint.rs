use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface};
use crate::state::*;

#[derive(Accounts)]
#[instruction()]
pub struct InitializeDumbsMint<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: This account is initialized as a Token-2022 or SPL mint.
    #[account(
        init,
        payer = authority,
        seeds = [b"dumbs_mint"],
        bump,
        mint::decimals = 9,
        mint::authority = betting_state,
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,
    
    #[account(
        mut,
        seeds = [b"betting_state", authority.key().as_ref()],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,

    
    pub rent: Sysvar<'info, Rent>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,

}

pub fn handler(
    ctx: Context<InitializeDumbsMint>,
) -> Result<()> {
    msg!("Starting DUMBS mint initialization...");
    msg!("Dumbs Mint address: {}", ctx.accounts.dumbs_mint.key());

    msg!("DUMBS mint initialized successfully");
    Ok(())
}