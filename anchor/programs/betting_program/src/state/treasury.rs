use anchor_lang::prelude::*;
use super::betting_state::TokenType;
use crate::errors::error_code::ErrorCode;

pub const TREASURY_SEED: &[u8] = b"treasury";

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub sol_fees_collected: u64,      // SOL fees from deposits
    pub dumbs_fees_collected: u64,    // DUMBS fees from bets
    pub rapr_fees_collected: u64,     // RAPR fees from bets
    pub total_fees_collected: u64,    // Total fees in SOL value
    pub total_house_edge: u32,        // From betting
    pub total_withdrawals: u64,
    pub last_withdrawal_timestamp: i64,
    pub bump: u8,
}

impl Treasury {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // sol_fees_collected
        8 + // dumbs_fees_collected
        8 + // rapr_fees_collected
        8 + // total_fees_collected
        4 + // total_house_edge
        8 + // total_withdrawals
        8 + // last_withdrawal_timestamp
        1; // bump

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        bump: u8,
    ) {
        self.authority = authority;
        self.sol_fees_collected = 0;
        self.dumbs_fees_collected = 0;
        self.rapr_fees_collected = 0;
        self.total_fees_collected = 0;
        self.total_house_edge = 0;
        self.total_withdrawals = 0;
        self.last_withdrawal_timestamp = 0;
        self.bump = bump;
    }

    pub fn collect_deposit_fee(
        &mut self,
        sol_amount: u64,
    ) -> Result<()> {
        self.sol_fees_collected = self.sol_fees_collected
            .checked_add(sol_amount)
            .ok_or(ErrorCode::CalculationOverflow)?;

        self.total_fees_collected = self.total_fees_collected
            .checked_add(sol_amount)
            .ok_or(ErrorCode::CalculationOverflow)?;

        Ok(())
    }

    pub fn collect_bet_fee(
        &mut self,
        amount: u64,
        token_type: TokenType
    ) -> Result<()> {
        match token_type {
            TokenType::DUMBS => {
                self.dumbs_fees_collected = self.dumbs_fees_collected
                    .checked_add(amount)
                    .ok_or(ErrorCode::CalculationOverflow)?;

                // Convert DUMBS amount to SOL value for total tracking
                self.total_fees_collected = self.total_fees_collected
                    .checked_add(amount)
                    .ok_or(ErrorCode::CalculationOverflow)?;
            },
            TokenType::RAPR => {
                self.rapr_fees_collected = self.rapr_fees_collected
                    .checked_add(amount)
                    .ok_or(ErrorCode::CalculationOverflow)?;
                
                // Convert RAPR amount to SOL value for total tracking
                self.total_fees_collected = self.total_fees_collected
                    .checked_add(amount)
                    .ok_or(ErrorCode::CalculationOverflow)?;
            }
        }

        Ok(())
    }

    pub fn collect_house_edge(&mut self, amount: u32) -> Result<()> {
        self.total_house_edge = self.total_house_edge
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        Ok(())
    }

    pub fn record_withdrawal(&mut self, amount: u64) -> Result<()> {
        self.total_withdrawals = self.total_withdrawals
            .checked_add(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        self.last_withdrawal_timestamp = Clock::get()?.unix_timestamp;
        Ok(())
    }
}