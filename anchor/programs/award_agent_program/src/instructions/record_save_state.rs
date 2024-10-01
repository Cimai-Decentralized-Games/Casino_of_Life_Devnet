use anchor_lang::prelude::*;
use crate::state::{GameSession, SaveState};
use crate::errors::ErrorCode;

pub fn handler(
    ctx: Context<RecordSaveState>,
    save_state_hash: [u8; 32],
    player1_health: u8,
    player2_health: u8,
    round_number: u8,
    player1_score: u32,
    player2_score: u32,
    game_clock: u32
) -> Result<()> {
    let game_session = &mut ctx.accounts.game_session;
    let save_state = &mut ctx.accounts.save_state;

    if save_state.sequence != game_session.current_save_state_sequence {
        return err!(ErrorCode::InvalidSaveStateSequence);
    }

    save_state.hash = save_state_hash;
    save_state.timestamp = Clock::get()?.unix_timestamp;
    save_state.player1_health = player1_health;
    save_state.player2_health = player2_health;
    save_state.round_number = round_number;
    save_state.player1_score = player1_score;
    save_state.player2_score = player2_score;
    save_state.game_clock = game_clock;

    game_session.current_save_state_sequence += 1;

    emit!(SaveStateRecorded {
        game_session: game_session.key(),
        save_state: save_state.key(),
        sequence: save_state.sequence,
        hash: save_state_hash,
        timestamp: save_state.timestamp,
        player1_health,
        player2_health,
        round_number,
        player1_score,
        player2_score,
        game_clock,
    });

    Ok(())
}

pub fn verify_save_state(ctx: Context<VerifySaveState>, expected_hash: [u8; 32]) -> Result<()> {
    let save_state = &ctx.accounts.save_state;

    if save_state.hash != expected_hash {
        return err!(ErrorCode::InvalidSaveStateHash);
    }

    emit!(SaveStateVerified {
        game_session: save_state.game_session,
        save_state: save_state.key(),
        sequence: save_state.sequence,
    });

    Ok(())
}

pub fn resume_from_save_state(ctx: Context<ResumeFromSaveState>) -> Result<()> {
    let game_session = &mut ctx.accounts.game_session;
    let save_state = &ctx.accounts.save_state;

    game_session.current_save_state_sequence = save_state.sequence;
    
    emit!(GameResumed {
        game_session: game_session.key(),
        save_state: save_state.key(),
        sequence: save_state.sequence,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RecordSaveState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"game_session", authority.key().as_ref()],
        bump,
    )]
    pub game_session: Account<'info, GameSession>,

    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<SaveState>(),
        seeds = [b"save_state", game_session.key().as_ref(), &game_session.current_save_state_sequence.to_le_bytes()],
        bump,
    )]
    pub save_state: Account<'info, SaveState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifySaveState<'info> {
    pub authority: Signer<'info>,
    #[account(
        seeds = [b"save_state", save_state.game_session.key().as_ref(), &save_state.sequence.to_le_bytes()],
        bump,
    )]
    pub save_state: Account<'info, SaveState>,
}

#[derive(Accounts)]
pub struct ResumeFromSaveState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"game_session", authority.key().as_ref()],
        bump,
    )]
    pub game_session: Account<'info, GameSession>,
    #[account(
        seeds = [b"save_state", game_session.key().as_ref(), &save_state.sequence.to_le_bytes()],
        bump,
    )]
    pub save_state: Account<'info, SaveState>,
}

#[event]
pub struct SaveStateRecorded {
    game_session: Pubkey,
    save_state: Pubkey,
    sequence: u64,
    hash: [u8; 32],
    timestamp: i64,
    player1_health: u8,
    player2_health: u8,
    round_number: u8,
    player1_score: u32,
    player2_score: u32,
    game_clock: u32,
}

#[event]
pub struct SaveStateVerified {
    game_session: Pubkey,
    save_state: Pubkey,
    sequence: u64,
}

#[event]
pub struct GameResumed {
    game_session: Pubkey,
    save_state: Pubkey,
    sequence: u64,
}