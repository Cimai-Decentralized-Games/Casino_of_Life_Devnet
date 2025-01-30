use anchor_lang::prelude::*;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;
use anchor_lang::solana_program::program_pack::Pack;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("GYLtHxFn26XJr9fcHgC28r2mPR64sUQqVu3EMfQ4FzER");


#[program]
pub mod betting_program {
    use super::*;

    // Initialize Instructions
    pub fn initialize_betting_state_base(ctx: Context<InitializeBettingStateBase>) -> Result<()> {
        instructions::initialize::initialize_betting_state_base::handler(ctx)
    }
    
    pub fn initialize_state_accounts(ctx: Context<InitializeStateAccounts>) -> Result<()> {
        instructions::initialize::initialize_state_accounts::handler(ctx)
    }

    pub fn initialize_dumbs_mint(ctx: Context<InitializeDumbsMint>) -> Result<()> {
        instructions::initialize::initialize_dumbs_mint::handler(ctx)
    }

    pub fn initialize_betting_state(ctx: Context<InitializeBettingState>) -> Result<()> {
        instructions::initialize::initialize_betting_state::handler(ctx)
    }

    pub fn initialize_bet_vault(ctx: Context<InitializeBetVault>) -> Result<()> {
        instructions::vault::initialize_bet_vault::handler(ctx)
    }

    pub fn initialize_rapr_vault(ctx: Context<InitializeRaprVault>) -> Result<()> {
        instructions::vault::initialize_rapr_vault::handler(ctx)
    }

    pub fn initialize_sol_vault(ctx: Context<InitializeSolVault>) -> Result<()> {
        instructions::vault::initialize_sol_vault::handler(ctx)
    }

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::vault::initialize_treasury::handler(ctx)
    }

    pub fn initialize_user_account(ctx: Context<InitializeUserAccount>) -> Result<()> {
        instructions::deposit_and_mint::initialize_user_account(ctx)
    }

    // Deposit, Mint Instructions and Create User Account
    pub fn deposit_sol(ctx: Context<DepositSol>, amount: u64) -> Result<()> {
        instructions::deposit_and_mint::deposit_sol::handler(ctx, amount)
    }

    // Betting Instructions
    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        fight_id: u64,
        odds: u64,
        token_type: TokenType
    ) -> Result<()> {
        instructions::betting::place_bet::handler(ctx, amount, fight_id, odds, token_type)
    }

    pub fn settle_bet(
        ctx: Context<SettleBet>,
        fight_id: u64,
        winner: Pubkey
    ) -> Result<()> {
        instructions::betting::settle_bet::handler(ctx, fight_id, winner)
    }

    pub fn cash_out(
        ctx: Context<CashOut>,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        instructions::betting::cash_out::handler(ctx, amount, token_type)
    }

    pub fn mint_dumbs_for_win(ctx: Context<MintDumbsForWin>, secure_fight_id: u64) -> Result<()> { // Modified function signature
        instructions::betting::mint_dumbs::handler(ctx, secure_fight_id)
    }

    pub fn create_user_betting_account(ctx: Context<CreateUserBettingAccount>) -> Result<()> {
        instructions::betting::create_user_betting_account::handler(ctx)
    }

    // Swap Instructions
    pub fn swap_sol_for_rapr(
        ctx: Context<SwapSolForRapr>,
        sol_amount: u64
    ) -> Result<()> {
        instructions::swap::sol_for_rapr::handler(ctx, sol_amount)
    }
}