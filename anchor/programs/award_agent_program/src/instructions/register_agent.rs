use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Mint};
use crate::state::Agent;
use crate::errors::ErrorCode;

pub fn register_agent(ctx: Context<RegisterAgent>, agent_name: String) -> Result<()> {
    let agent = &mut ctx.accounts.agent_data;
    
    // Clone agent_name before moving it
    let agent_name_clone = agent_name.clone();
    
    agent.name = agent_name;
    agent.nft_mint = ctx.accounts.nft_mint.key();
    agent.owner = ctx.accounts.player.key();
    agent.bump = ctx.bumps.agent_data;
    
    emit!(AgentRegisteredEvent {
        agent: agent.key(),
        nft_mint: ctx.accounts.nft_mint.key(),
        agent_name: agent_name_clone,
        player: ctx.accounts.player.key(),
        // ... other fields ...
    });

    Ok(())
}

pub fn handler(ctx: Context<RegisterAgent>, agent_name: String) -> Result<()> {
    // Your implementation here
    Ok(())
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init_if_needed,
        payer = player,
        space = 8 + std::mem::size_of::<Agent>(),
        seeds = [b"agent", nft_mint.key().as_ref()],
        bump,
    )]
    pub agent_data: Account<'info, Agent>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        associated_token::mint = nft_mint,
        associated_token::authority = player,
    )]
    pub nft_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[event]
pub struct AgentRegisteredEvent {
    player: Pubkey,
    agent: Pubkey,
    nft_mint: Pubkey,
    agent_name: String,
}