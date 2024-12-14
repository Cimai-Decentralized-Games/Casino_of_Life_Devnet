use anchor_lang::prelude::*;

declare_id!("7SKb68VU9C8Pmjip67q7xDjqnLekaUUNA7gM8AB5MDxN");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod nft_game_agent_program {
    use super::*;

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        instructions::initialize_treasury::initialize_treasury_handler(ctx)
    }

    pub fn create_collection(
        ctx: Context<CreateCollection>,
        name: String,
        symbol: String,
        strategy: String,
        collection_id: Pubkey,
    ) -> Result<()> {
        instructions::create_collection::create_collection_handler(ctx, name, symbol, strategy, collection_id)
    }

    pub fn initialize_ai_agent_accounts(
        ctx: Context<InitializeAIAgentAccounts>,
        id: Pubkey,
    ) -> Result<()> {
        instructions::initialize_ai_agent_accounts(ctx, id)
    }

    pub fn mint_ai_agent(
        ctx: Context<MintAIAgent>,
        id: Pubkey,
        name: String,
        symbol: String,
        uri: String,
        model_hash: [u8; 32],
        collection_id: Pubkey,
        collection_bump: u8,
    ) -> Result<()> {
        instructions::mint_ai_agent::mint_ai_agent_handler(ctx, id, name, symbol, uri, model_hash, collection_id, collection_bump)
    }
}