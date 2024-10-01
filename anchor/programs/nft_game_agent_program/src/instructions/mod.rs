// src/instructions/mod.rs

pub mod create_collection;
pub mod initialize_ai_agent_accounts;
pub mod mint_ai_agent;
pub mod initialize_treasury;

pub use create_collection::*;
pub use initialize_ai_agent_accounts::*;
pub use mint_ai_agent::*;
pub use initialize_treasury::*;