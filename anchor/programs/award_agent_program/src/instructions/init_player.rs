use anchor_lang::prelude::*;
use crate::state::{Player, Agent, Treasury};
use crate::errors::ErrorCode;
use crate::constants::{MAX_HEALTH, MAX_AGENT_NAME_LENGTH};

pub fn handler(ctx: Context<InitPlayer>, agent_name: String) -> Result<()> {
    let player = &mut ctx.accounts.player_data;
    let agent = &mut ctx.accounts.agent_data;

    // Initialize player data
    player.health = MAX_HEALTH;
    player.wins = 0;
    player.losses = 0;
    player.enemies_killed = 0;
    player.last_kill_timestamp = 0;
    player.last_heal_timestamp = 0;
    player.last_battle_timestamp = 0;

    // Initialize agent data
    if agent_name.len() > MAX_AGENT_NAME_LENGTH {
        return err!(ErrorCode::AgentNameTooLong);
    }
    agent.name = agent_name.clone();
    agent.owner = ctx.accounts.player.key();
    agent.wins = 0;
    agent.losses = 0;
    agent.enemies_killed = 0;

    // Collect fee and transfer to treasury
    let fee = 1000; // Define the fee amount
    let seeds = &[b"award_agent_authority".as_ref(), &[ctx.bumps.award_agent_authority]];
    let signer = &[&seeds[..]];
    let cpi_accounts = MintTo {
        mint: ctx.accounts.dumbs_token_mint.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
        authority: ctx.accounts.award_agent_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
    token::mint_to(cpi_ctx, fee)?;

    // Emit player initialization event
    emit!(PlayerInitializedEvent {
        player: ctx.accounts.player.key(),
        agent: ctx.accounts.agent_data.key(),
        agent_name,
        initial_health: player.health,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitPlayer<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        init,
        payer = player,
        space = 8 + std::mem::size_of::<Player>(),
        seeds = [b"player", player.key().as_ref()],
        bump,
    )]
    pub player_data: Account<'info, Player>,

    #[account(
        init,
        payer = player,
        space = 8 + std::mem::size_of::<Agent>(),
        seeds = [b"agent", player.key().as_ref()],
        bump,
    )]
    pub agent_data: Account<'info, Agent>,

    #[account(mut)]
    pub dumbs_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct PlayerInitializedEvent {
    player: Pubkey,
    agent: Pubkey,
    agent_name: String,
    initial_health: u8,
}