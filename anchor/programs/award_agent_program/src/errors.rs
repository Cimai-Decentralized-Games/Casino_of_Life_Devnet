use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Not enough health")]
    NotEnoughHealth,
    #[msg("Insufficient tokens")]
    InsufficientTokens,
    #[msg("Agent name exceeds maximum length")]
    AgentNameTooLong,
    #[msg("Player does not own the NFT")]
    NoNFTOwnership,
    #[msg("Not full health")]
    FullHealth,
    #[msg("Invalid Heal Amount")]
    InvalidHealAmount,
    #[msg("Invalid Save State Sequence")]
    InvalidSaveStateSequence,
    #[msg("Invalid Battle Sequence")]
    InvalidBattleSequence,
    #[msg("Invalid Kill Sequence")]
    InvalidKillSequence,
    #[msg("Invalid Heal Sequence")]
    InvalidHealSequence,
    #[msg("Invalid Save State Hash")]
    InvalidSaveStateHash,
}