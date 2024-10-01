use anchor_lang::prelude::*;
use anchor_spl::{
    token::{self, Mint, Token, TokenAccount},
    associated_token::AssociatedToken,
};
use crate::state::{Player, Agent};
use crate::errors::ErrorCode;
use crate::constants::{HEALTH_LOSS_PER_BATTLE, REWARD_PER_WIN};

pub fn handler(ctx: Context<Battle>, player1_damage: u8, player2_damage: u8) -> Result<()> {
    let player1 = &mut ctx.accounts.player1_data;
    let player2 = &mut ctx.accounts.player2_data;
    let agent1 = &mut ctx.accounts.agent1_data;
    let agent2 = &mut ctx.accounts.agent2_data;

    // Ensure both players have enough health
    if player1.health == 0 || player2.health == 0 {
        return err!(ErrorCode::NotEnoughHealth);
    }

    // Update health based on damage
    player1.health = player1.health.saturating_sub(player1_damage);
    player2.health = player2.health.saturating_sub(player2_damage);

    // Determine winner
    let (winner, loser) = if player1_damage < player2_damage {
        (player1, player2)
    } else {
        (player2, player1)
    };

    // Update win/loss records
    winner.wins += 1;
    loser.losses += 1;

    // Update agent stats
    if player1_damage < player2_damage {
        agent1.wins += 1;
        agent2.losses += 1;
    } else {
        agent2.wins += 1;
        agent1.losses += 1;
    }

    // Mint reward tokens to winner
    let seeds = b"reward";
    let bump = ctx.bumps.reward_token_mint;
    let signer: &[&[&[u8]]] = &[&[seeds, &[bump]]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            mint: ctx.accounts.reward_token_mint.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: ctx.accounts.reward_token_mint.to_account_info(),
        },
        signer,
    );

    token::mint_to(cpi_ctx, REWARD_PER_WIN)?;

    // Emit battle result event
    emit!(BattleResult {
        winner: winner.key(),
        loser: loser.key(),
        winner_health: winner.health,
        loser_health: loser.health,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct Battle<'info> {
    #[account(mut)]
    pub player1: Signer<'info>,
    #[account(mut)]
    pub player2: Signer<'info>,

    #[account(
        mut,
        seeds = [b"player", player1.key().as_ref()],
        bump,
    )]
    pub player1_data: Account<'info, Player>,

    #[account(
        mut,
        seeds = [b"player", player2.key().as_ref()],
        bump,
    )]
    pub player2_data: Account<'info, Player>,

    #[account(
        mut,
        seeds = [b"agent", player1.key().as_ref()],
        bump,
    )]
    pub agent1_data: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"agent", player2.key().as_ref()],
        bump,
    )]
    pub agent2_data: Account<'info, Agent>,

    #[account(
        mut,
        seeds = [b"reward"],
        bump,
    )]
    pub reward_token_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = reward_token_mint,
        associated_token::authority = player1,
    )]
    pub winner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct BattleResult {
    winner: Pubkey,
    loser: Pubkey,
    winner_health: u8,
    loser_health: u8,
}