use anchor_lang::prelude::*;
use super::betting_state::TokenType;
use crate::errors::error_code::ErrorCode;

pub const RAPR_VAULT_SEED: &[u8] = b"rapr_vault";

#[account]
pub struct RaprVault {
    pub authority: Pubkey,
    pub rapr_balance: u64,
    pub total_rapr_bets: u64,
    pub total_rapr_wagered: u64,
    pub total_rapr_payouts: u64,
    pub bump: u8,
}

impl RaprVault {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // rapr_balance
        8 + // total_rapr_bets
        8 + // total_rapr_wagered
        8 + // total_rapr_payouts
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        bump: u8,
    ) {
        self.authority = authority;
        self.rapr_balance = 0;
        self.total_rapr_bets = 0;
        self.total_rapr_wagered = 0;
        self.total_rapr_payouts = 0;
        self.bump = bump;
    }

    pub fn process_bet(
        &mut self,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        require!(token_type == TokenType::RAPR, ErrorCode::InvalidTokenType);
        
        self.rapr_balance = self.rapr_balance
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        self.total_rapr_bets = self.total_rapr_bets
            .checked_add(1)
            .ok_or(ErrorCode::CalculationOverflow)?;
        self.total_rapr_wagered = self.total_rapr_wagered
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        Ok(())
    }

    pub fn process_payout(
        &mut self,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        require!(token_type == TokenType::RAPR, ErrorCode::InvalidTokenType);
        
        self.rapr_balance = self.rapr_balance
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientBalance)?;
        self.total_rapr_payouts = self.total_rapr_payouts
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        Ok(())
    }
}