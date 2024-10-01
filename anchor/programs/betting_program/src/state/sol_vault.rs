use anchor_lang::prelude::*;

#[account]
pub struct SolVault {
    pub balance: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum SolVaultError {
    #[msg("Insufficient funds in the SOL vault")]
    InsufficientFunds,
    #[msg("Calculation overflow")]
    CalculationOverflow,
}

impl SolVault {
    pub const LEN: usize = 8 + 32;

    pub fn transfer_to_treasury(&mut self, amount: u64) -> Result<()> {
        require!(self.balance >= amount, SolVaultError::InsufficientFunds);
        self.balance -= amount;
        Ok(())
    }

    pub fn transfer_to_bet_vault(&mut self, amount: u64) -> Result<()> {
        require!(self.balance >= amount, SolVaultError::InsufficientFunds);
        self.balance -= amount;
        Ok(())
    }

    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        self.balance = self.balance.checked_add(amount).ok_or(SolVaultError::CalculationOverflow)?;
        Ok(())
    }
}