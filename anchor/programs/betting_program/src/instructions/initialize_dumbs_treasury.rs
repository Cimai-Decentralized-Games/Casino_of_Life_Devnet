use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::{AssociatedToken, Create};
use crate::state::*;

#[derive(Accounts)]
pub struct InitializeDumbsTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + DumbsTreasury::LEN,
        seeds = [DUMBS_TREASURY_SEED],
        bump
    )]
    pub dumbs_treasury: Account<'info, DumbsTreasury>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = dumbs_mint,
        associated_token::authority = dumbs_treasury
    )]
    pub dumbs_treasury_account: Account<'info, TokenAccount>,

    pub dumbs_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeDumbsTreasury>) -> Result<()> {
    let dumbs_treasury = &mut ctx.accounts.dumbs_treasury;
    dumbs_treasury.initialize(ctx.accounts.dumbs_treasury_account.key());
    Ok(())
}