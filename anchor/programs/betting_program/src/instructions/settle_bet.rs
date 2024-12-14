use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, MintTo, Transfer};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use structural_convert::StructuralConvert;

#[derive(Accounts, StructuralConvert)]
#[instruction(fight_id: u64, winner: Pubkey)]
pub struct SettleBet<'info> {
    #[account(
        mut,
        constraint = authority.key() == betting_state.authority @ ErrorCode::Unauthorized
    )]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"bet_vault", betting_state.key().as_ref()],
        bump
    )]
    pub bet_vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"sol_vault"],
        bump,
        constraint = sol_vault.authority == betting_state.authority @ ErrorCode::Unauthorized
    )]
    pub sol_vault: Account<'info, SolVault>,
    #[account(
        mut,
        seeds = [b"bet", bet.bettor.as_ref(), &bet.fight_id.to_le_bytes()],
        bump,
        constraint = !bet.settled @ ErrorCode::BetAlreadySettled,
        constraint = bet.fight_id == fight_id @ ErrorCode::InvalidFightId
    )]
    pub bet: Account<'info, Bet>,
    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = bet.bettor
    )]
    pub bettor_dumbs_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump
    )]
    pub dumbs_mint: Account<'info, token::Mint>,
    #[account(
        mut,
        seeds = [b"betting_state"],
        bump,
        has_one = authority @ ErrorCode::Unauthorized
    )]
    pub betting_state: Account<'info, BettingState>,
    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    #[account(
        mut,
        seeds = [b"dumbs_treasury"],
        bump
    )]
    pub dumbs_treasury: Account<'info, DumbsTreasury>,
    #[account(
        mut,
        associated_token::mint = dumbs_mint,
        associated_token::authority = dumbs_treasury
    )]
    pub treasury_dumbs_account: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<SettleBet>, fight_id: u64, winner: Pubkey) -> Result<()> {
    let bet = &mut ctx.accounts.bet;
    let betting_state = &ctx.accounts.betting_state;
    let treasury = &mut ctx.accounts.treasury;
    let sol_vault = &mut ctx.accounts.sol_vault;

    if bet.settled {
        return Err(ErrorCode::BetAlreadySettled.into());
    }

    if bet.fight_id != fight_id {
        return Err(ErrorCode::InvalidFightId.into());
    }

    if ctx.accounts.authority.key() != betting_state.authority {
        return Err(ErrorCode::Unauthorized.into());
    }

    let won = bet.bettor == winner;

    if won {
        // Mark bet as won but don't mint or payout yet
        // User needs to call cash_out to claim winnings
        bet.settled = true;
    } else {
        // If bet is lost:
        let betting_state_bump = ctx.bumps.betting_state;
        let betting_state_seeds = &[
            b"betting_state".as_ref(),
            &[betting_state_bump],
        ];
        let betting_state_signer = &[&betting_state_seeds[..]];

        // Transfer lost DUMBS from bet vault to treasury
        let cpi_accounts = Transfer {
            from: ctx.accounts.bet_vault.to_account_info(),
            to: ctx.accounts.treasury_dumbs_account.to_account_info(),
            authority: ctx.accounts.betting_state.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(
            cpi_program,
            cpi_accounts,
            betting_state_signer
        );
        token::transfer(cpi_ctx, bet.amount)?;

        // Record the house edge
        treasury.collect_house_edge(bet.amount);
        bet.settled = true;
    }

    // Update betting state
    ctx.accounts.betting_state.total_potential_payout = betting_state.total_potential_payout
        .checked_sub(bet.amount.checked_mul(bet.odds).unwrap() / 100)
        .unwrap();

    Ok(())
}