use anchor_lang::prelude::*;
use super::betting_state::TokenType;
use crate::errors::error_code::ErrorCode;

pub const BET_VAULT_SEED: &[u8] = b"bet_vault";

#[account]
pub struct BetVault {
    pub authority: Pubkey,
    pub dumbs_balance: u64,
    pub total_dumbs_bets: u64,
    pub total_dumbs_wagered: u64,
    pub total_dumbs_payouts: u64,
    pub bump: u8,
}

impl BetVault {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // dumbs_balance
        8 + // total_dumbs_bets
        8 + // total_dumbs_wagered
        8 + // total_dumbs_payouts
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        bump: u8,
    ) {
        self.authority = authority;
        self.dumbs_balance = 0;
        self.total_dumbs_bets = 0;
        self.total_dumbs_wagered = 0;
        self.total_dumbs_payouts = 0;
        self.bump = bump;
    }

    pub fn process_bet(
        &mut self,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        require!(token_type == TokenType::DUMBS, ErrorCode::InvalidTokenType);
        
        self.dumbs_balance = self.dumbs_balance
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        self.total_dumbs_bets = self.total_dumbs_bets
            .checked_add(1)
            .ok_or(ErrorCode::CalculationOverflow)?;
        self.total_dumbs_wagered = self.total_dumbs_wagered
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        Ok(())
    }

    pub fn process_payout(
        &mut self,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        require!(token_type == TokenType::DUMBS, ErrorCode::InvalidTokenType);
        
        self.dumbs_balance = self.dumbs_balance
            .checked_sub(amount)
            .ok_or(ErrorCode::InsufficientBalance)?;
        self.total_dumbs_payouts = self.total_dumbs_payouts
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        
        Ok(())
    }
}