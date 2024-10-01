use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Burn, Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::state::Player;
use crate::errors::ErrorCode;
use crate::constants::{MAX_HEALTH, HEAL_AMOUNT_PER_TOKEN, MIN_HEAL_AMOUNT, MAX_HEAL_AMOUNT};

pub fn handler(ctx: Context<Heal>, amount_to_burn: u64) -> Result<()> {
    let player = &mut ctx.accounts.player_data;
    let token_account = &ctx.accounts.player_token_account;

    // Check if player needs healing
    if player.health == MAX_HEALTH {
        return err!(ErrorCode::FullHealth);
    }

    // Check if the amount to burn is within allowed range
    if amount_to_burn < MIN_HEAL_AMOUNT || amount_to_burn > MAX_HEAL_AMOUNT {
        return err!(ErrorCode::InvalidHealAmount);
    }

    // Check if player has enough tokens
    if token_account.amount < amount_to_burn {
        return err!(ErrorCode::InsufficientTokens);
    }

    // Calculate health to restore
    let health_to_restore = (amount_to_burn as u32 * HEAL_AMOUNT_PER_TOKEN as u32 / 100) as u8;
    let new_health = player.health.saturating_add(health_to_restore).min(MAX_HEALTH);
    let actual_health_restored = new_health - player.health;

    // Burn tokens
    let seeds = b"award_agent_authority";
    let bump = ctx.bumps.award_agent_authority;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.dumbs_token_mint.to_account_info(),
            from: ctx.accounts.player_token_account.to_account_info(),
            authority: ctx.accounts.award_agent_authority.to_account_info(),
        },
        signer,
    );

    token::burn(cpi_ctx, amount_to_burn)?;

    // Update player health
    player.health = new_health;

    // Update last heal timestamp
    player.last_heal_timestamp = Clock::get()?.unix_timestamp;

    // Emit heal event
    emit!(HealEvent {
        player: ctx.accounts.player.key(),
        tokens_burned: amount_to_burn,
        health_restored: actual_health_restored,
        new_health: new_health,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Heal<'info> {
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
        associated_token::mint = dumbs_token_mint,
        associated_token::authority = player
    )]
    pub player_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub dumbs_token_mint: Account<'info, Mint>,

    /// CHECK: This is the PDA that has authority to mint/burn DUMBS tokens
    #[account(
        seeds = [b"award_agent_authority"],
        bump,
    )]
    pub award_agent_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct HealEvent {
    player: Pubkey,
    tokens_burned: u64,
    health_restored: u8,
    new_health: u8,
}