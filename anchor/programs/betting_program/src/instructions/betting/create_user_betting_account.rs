use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::error_code::ErrorCode;

#[derive(Accounts)]
pub struct CreateUserBettingAccount<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = UserBettingAccount::LEN,
        seeds = [USER_BETTING_ACCOUNT_SEED, payer.key().as_ref()],
        bump,
    )]
    pub user_betting_account: Account<'info, UserBettingAccount>,


    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CreateUserBettingAccount>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_betting_account;


    // Initialize UserBettingAccount
    user_account.initialize(
        ctx.accounts.payer.key(),
        ctx.bumps.user_betting_account,
    )?;


    Ok(())
}