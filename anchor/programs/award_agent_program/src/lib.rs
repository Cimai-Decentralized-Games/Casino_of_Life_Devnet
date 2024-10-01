use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;

use instructions::*;

declare_id!("2yy9m1WazMDsVBobYHvTpYz7Pr7t6xScV2r663xN5WC6");

#[program]
pub mod award_agent_program {
    use super::*;

    pub fn create_mint(ctx: Context<CreateMint>, uri: String, name: String, symbol: String) -> Result<()> {
        instructions::create_mint::handler(ctx, uri, name, symbol)
    }

    pub fn init_player(ctx: Context<InitPlayer>, agent_name: String) -> Result<()> {
        instructions::init_player::handler(ctx, agent_name)
    }

    pub fn kill_enemy(ctx: Context<KillEnemy>, enemy_difficulty: u8) -> Result<()> {
        instructions::kill_enemy::handler(ctx, enemy_difficulty)
    }

    pub fn heal(ctx: Context<Heal>, amount_to_burn: u64) -> Result<()> {
        instructions::heal::handler(ctx, amount_to_burn)
    }

    pub fn battle(ctx: Context<Battle>, player1_damage: u8, player2_damage: u8) -> Result<()> {
        instructions::battle::handler(ctx, player1_damage, player2_damage)
    }

    pub fn register_agent(ctx: Context<RegisterAgent>, agent_name: String) -> Result<()> {
        instructions::register_agent::handler(ctx, agent_name)
    }

    pub fn record_save_state(
        ctx: Context<RecordSaveState>,
        save_state_hash: [u8; 32],
        player1_health: u8,
        player2_health: u8,
        round_number: u8,
        player1_score: u32,
        player2_score: u32,
        game_clock: u32
    ) -> Result<()> {
        instructions::record_save_state::handler(
            ctx,
            save_state_hash,
            player1_health,
            player2_health,
            round_number,
            player1_score,
            player2_score,
            game_clock
        )
    }
}