use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount, MintTo, Burn},
    associated_token::AssociatedToken,
};
use crate::state::{Player, Agent, Treasury};
use crate::errors::ErrorCode;
use crate::constants::{HEALTH_LOSS_PER_KILL, BASE_REWARD_PER_KILL, MAX_REWARD_MULTIPLIER, FEE_AMOUNT};

pub fn handler(ctx: Context<KillEnemy>, enemy_difficulty: u8) -> Result<()> {
    let player = &mut ctx.accounts.player_data;
    let agent = &mut ctx.accounts.agent_data;

    // Check if player has enough health
    if player.health == 0 {
        return err!(ErrorCode::NotEnoughHealth);
    }

    // Subtract health from player
    player.health = player.health.saturating_sub(HEALTH_LOSS_PER_KILL);

    // Update player and agent stats
    player.enemies_killed += 1;
    agent.enemies_killed += 1;

    // Calculate reward based on enemy difficulty
    let reward_multiplier = enemy_difficulty.min(MAX_REWARD_MULTIPLIER) as u64;
    let reward_amount = BASE_REWARD_PER_KILL * reward_multiplier;

    // Mint reward tokens to player
    let seeds = &[b"award_agent_authority".as_ref(), &[ctx.bumps.award_agent_authority]];
    let signer = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.dumbs_token_mint.to_account_info(),
            to: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.award_agent_authority.to_account_info(),
        },
        signer,
    );

    token::mint_to(cpi_ctx, reward_amount)?;

    // Collect fee and transfer to treasury
    let fee = FEE_AMOUNT; // Define the fee amount
    let cpi_accounts = MintTo {
        mint: ctx.accounts.dumbs_token_mint.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
        authority: ctx.accounts.award_agent_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
    token::mint_to(cpi_ctx, fee)?;

    // Burn tokens as a fee
    let burn_amount = FEE_AMOUNT; // Define the burn amount
    let cpi_accounts = Burn {
        mint: ctx.accounts.dumbs_token_mint.to_account_info(),
        from: ctx.accounts.player_token_account.to_account_info(),
        authority: ctx.accounts.award_agent_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
    token::burn(cpi_ctx, burn_amount)?;

    // Update last kill timestamp
    player.last_kill_timestamp = Clock::get()?.unix_timestamp;

    // Emit kill event
    emit!(KillEnemyEvent {
        player: ctx.accounts.player.key(),
        agent: ctx.accounts.agent_data.key(),
        enemy_difficulty,
        reward_amount,
        new_health: player.health,
        total_enemies_killed: player.enemies_killed,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct KillEnemy<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"player", player.key().as_ref()],
        bump,
    )]
    pub player_data: Account<'info, Player>,

    #[account(
        mut,
        seeds = [b"agent", player.key().as_ref()],
        bump,
    )]
    pub agent_data: Account<'info, Agent>,

    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = dumbs_token_mint,
        associated_token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"award_agent_authority"],
        bump,
    )]
    pub award_agent_authority: UncheckedAccount<'info>,

    #[account(mut)]
    pub dumbs_token_mint: Account<'info, Mint>,

    #[account(mut)]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct KillEnemyEvent {
    player: Pubkey,
    agent: Pubkey,
    enemy_difficulty: u8,
    reward_amount: u64,
    new_health: u8,
    total_enemies_killed: u64,
}