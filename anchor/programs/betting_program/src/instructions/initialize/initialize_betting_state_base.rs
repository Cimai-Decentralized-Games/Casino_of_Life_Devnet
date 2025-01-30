use anchor_lang::prelude::*;
use crate::state::*;

/// Seed prefix for deriving the betting state PDA
pub const BETTING_STATE_SEED: &[u8] = b"betting_state";

#[derive(Accounts)]
#[instruction()]
pub struct InitializeBettingStateBase<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + BettingState::LEN,
        seeds = [BETTING_STATE_SEED, authority.key().as_ref()],
        bump
    )]
    pub betting_state: Account<'info, BettingState>,

    pub system_program: Program<'info, System>,
}

/// Handler to initialize the betting state.
/// 
/// # Arguments
/// * `ctx` - The context object containing the accounts
///
/// Sets up a new betting state account with the specified authority and stores the PDA bump.
pub fn handler(ctx: Context<InitializeBettingStateBase>) -> Result<()> {
    msg!("Initializing betting state base...");
    
    let betting_state = &mut ctx.accounts.betting_state;

    // Set the authority who can manage the betting state
    betting_state.authority = ctx.accounts.authority.key();
    // Store the bump used for PDA derivation
    betting_state.bump = ctx.bumps.betting_state;
    
    Ok(())
}