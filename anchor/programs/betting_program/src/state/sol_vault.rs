use anchor_lang::prelude::*;
use crate::errors::error_code::ErrorCode;

pub const SOL_VAULT_SEED: &[u8] = b"sol_vault";

#[account]
pub struct SolVault {
    pub authority: Pubkey,
    pub balance: u64,
    pub total_deposits: u64,
    pub total_sol_received: u64,
    pub total_dumbs_minted: u64,
    pub min_deposit_amount: u64,
    pub max_deposit_amount: u64,
    pub bump: u8,
}

impl SolVault {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        8 + // balance
        8 + // total_deposits
        8 + // total_sol_received
        8 + // total_dumbs_minted
        8 + // min_deposit_amount
        8 + // max_deposit_amount
        1; // bump

    pub fn process_deposit(
        &mut self,
        sol_amount: u64,
    ) -> Result<()> {
        require!(
            sol_amount >= self.min_deposit_amount,
            ErrorCode::AmountTooSmall
        );
        require!(
            sol_amount <= self.max_deposit_amount,
            ErrorCode::AmountTooLarge
        );

        // Update balance and stats
        self.balance = self.balance
            .checked_add(sol_amount)
            .ok_or(ErrorCode::CalculationOverflow)?;

        self.total_deposits = self.total_deposits
            .checked_add(1)
            .ok_or(ErrorCode::CalculationOverflow)?;

        self.total_sol_received = self.total_sol_received
            .checked_add(sol_amount)
            .ok_or(ErrorCode::CalculationOverflow)?;

        Ok(())
    }

    pub fn initialize(
        &mut self,
        authority: Pubkey,
        min_amount: u64,
        max_amount: u64,
        bump: u8,
    ) {
        self.authority = authority;
        self.balance = 0;
        self.total_deposits = 0;
        self.total_sol_received = 0;
        self.total_dumbs_minted = 0;
        self.min_deposit_amount = min_amount;
        self.max_deposit_amount = max_amount;
        self.bump = bump;
    }
}