use anchor_lang::prelude::*;
use crate::state::*;
use structural_convert::StructuralConvert;

#[derive(Accounts, StructuralConvert)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 8 + 8 + 1, // Adjust space as needed
        seeds = [b"user_account", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeUser>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.authority = ctx.accounts.user.key();
    user_account.sol_balance = 0;
    user_account.dumbs_balance = 0;
    Ok(())
}