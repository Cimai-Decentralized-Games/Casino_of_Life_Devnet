// settle_bet.rs
use anchor_lang::prelude::*;
use anchor_spl::token_2022::{self, Token2022};
use anchor_spl::token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface};
use crate::state::*;
use crate::errors::error_code::ErrorCode;
use crate::state::bet::Bet;

#[derive(Accounts)]
#[instruction(fight_id: u64, winner: Pubkey)]
pub struct SettleBet<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_BETTING_ACCOUNT_SEED, bettor.key().as_ref()],
        bump,
        constraint = user_betting_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_betting_account: Account<'info, UserBettingAccount>,

    /// CHECK: Verified through user_betting_account constraint
    pub bettor: AccountInfo<'info>,

    #[account(
        mut,
        constraint = user_dumbs_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_dumbs_account: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        constraint = user_rapr_account.owner == bettor.key() @ ErrorCode::InvalidAccount
    )]
    pub user_rapr_account: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"bet_vault"],
        bump,
    )]
    pub bet_vault_dumbs: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"rapr_vault"],
        bump,
        constraint = bet_vault_rapr.key() == betting_state.rapr_vault @ ErrorCode::InvalidAccount
    )]
    pub bet_vault_rapr: InterfaceAccount<'info, TokenAccountInterface>,

    #[account(
        mut,
        seeds = [b"dumbs_mint"],
        bump,
    )]
    pub dumbs_mint: InterfaceAccount<'info, MintInterface>,

    #[account(
        mut,
        seeds = [b"treasury"],
        bump
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(
        mut,
        seeds = [b"betting_state"],
        bump,
        has_one = treasury,
        constraint = betting_state.is_initialized() @ ErrorCode::NotInitialized
    )]
    pub betting_state: Account<'info, BettingState>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn handler(mut ctx: Context<SettleBet>, fight_id: u64, winner: Pubkey) -> Result<()> {
    let bettor = ctx.accounts.bettor.key();
    let user_account = &mut ctx.accounts.user_betting_account;

    // Check if there is an active bet
    let bet = user_account
        .active_bet
        .as_mut()
        .ok_or(ErrorCode::BetNotFound)?;

    // Ensure the bet matches the fight_id and bettor
    require!(
        bet.fight_id == fight_id as u32 && bet.bettor == bettor,
        ErrorCode::InvalidBettor
    );

    // Settle the bet
    bet.settle(bet.bettor == winner)?;

    let token_type = bet.token_type;
    let bet_amount = bet.amount;

    let dumbs_payout = if bet.won {
        let payout = ctx
            .accounts
            .betting_state
            .mint_dumbs_for_win(bet.potential_payout, token_type)?;

        let betting_state_seeds = &[
            b"betting_state".as_ref(),
            &[ctx.bumps.betting_state], // Access the bump value directly
        ];
        let signer = &[&betting_state_seeds[..]];

        // Mint DUMBS to vault
        token_2022::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::MintTo {
                    mint: ctx.accounts.dumbs_mint.to_account_info(),
                    to: ctx.accounts.bet_vault_dumbs.to_account_info(),
                    authority: ctx.accounts.betting_state.to_account_info(),
                },
                signer,
            ),
            payout as u64,
        )?;

        // Transfer DUMBS to user
        token_2022::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token_2022::Transfer {
                    from: ctx.accounts.bet_vault_dumbs.to_account_info(),
                    to: ctx.accounts.user_dumbs_account.to_account_info(),
                    authority: ctx.accounts.betting_state.to_account_info(),
                },
                signer,
            ),
            payout as u64,
        )?;

        // Handle RAPR return if applicable
        if token_type == TokenType::RAPR {
            token_2022::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    token_2022::Transfer {
                        from: ctx.accounts.bet_vault_rapr.to_account_info(),
                        to: ctx.accounts.user_rapr_account.to_account_info(),
                        authority: ctx.accounts.betting_state.to_account_info(),
                    },
                    signer,
                ),
                bet_amount as u64,
            )?;

            ctx.accounts.betting_state.total_rapr_in_circulation = ctx
                .accounts
                .betting_state
                .total_rapr_in_circulation
                .checked_sub(bet_amount as u64)
                .ok_or(ErrorCode::CalculationOverflow)?;
        }

        payout
    } else {
        0
    };

    // Update state
    ctx.accounts.treasury.collect_house_edge(bet_amount as u32)?;
    ctx.accounts.betting_state.total_potential_payout = ctx
        .accounts
        .betting_state
        .total_potential_payout
        .checked_sub(bet.potential_payout as u64)
        .ok_or(ErrorCode::CalculationOverflow)?;

        if dumbs_payout > 0 {
            user_account.update_winnings(dumbs_payout as u64)?;
        }

    // Remove the active bet
    user_account.remove_active_bet()?;

    Ok(())
}