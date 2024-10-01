use anchor_lang::prelude::*;
use crate::state::AIAgent;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
#[instruction(id: Pubkey)]
pub struct InitializeAIAgentAccounts<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = AIAgent::LEN,
        seeds = [b"ai_agent", id.as_ref()],
        bump
    )]
    pub ai_agent: Account<'info, AIAgent>,
    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub mint: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_ai_agent_accounts(
    ctx: Context<InitializeAIAgentAccounts>,
    id: Pubkey,
) -> Result<()> {
    let ai_agent = &mut ctx.accounts.ai_agent;
    ai_agent.id = id;
    ai_agent.error_message = None;
    Ok(())
}
