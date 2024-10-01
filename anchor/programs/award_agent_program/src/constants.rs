use anchor_lang::prelude::*;

pub const ADMIN_PUBKEY: Pubkey = pubkey!("C3fqiofRAL7FuQmgpjtdvAzXXRp9TqZRtVEAxXQAfeCm");
pub const MAX_HEALTH: u8 = 100;
pub const HEAL_AMOUNT_PER_TOKEN: u8 = 5; // 5% health per token
pub const MIN_HEAL_AMOUNT: u64 = 1_000_000_000; // 1 token with 9 decimals
pub const MAX_HEAL_AMOUNT: u64 = 10_000_000_000; // 10 tokens with 9 decimals
pub const HEALTH_LOSS_PER_BATTLE: u8 = 10;
pub const REWARD_PER_WIN: u64 = 1_000_000_000; // 1 token with 9 decimals
pub const HEALTH_LOSS_PER_KILL: u8 = 10;
pub const BASE_REWARD_PER_KILL: u64 = 1_000_000_000; // 1 token with 9 decimals
pub const MAX_REWARD_MULTIPLIER: u8 = 10;
pub const INITIAL_DUMBS_TOKENS: u64 = 10_000_000_000; // 10 tokens with 9 decimals
pub const MAX_AGENT_NAME_LENGTH: usize = 32;