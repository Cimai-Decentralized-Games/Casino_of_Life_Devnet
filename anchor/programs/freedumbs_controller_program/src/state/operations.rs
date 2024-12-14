use anchor_lang::prelude::*;
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OperationType {
    Mint,
    Burn,
    Transfer,
    Swap,
}

impl OperationType {
    pub fn requires_recipient(&self) -> bool {
        matches!(self, OperationType::Transfer | OperationType::Swap)
    }

    pub fn requires_output_amount(&self) -> bool {
        matches!(self, OperationType::Swap)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct OperationParameters {
    pub amount: u64,
    pub min_output_amount: u64,
    pub max_input_amount: u64,
    pub deadline: u64,
    pub recipient: Option<Pubkey>,
    pub fee_tier: u8,
    pub operation_type: OperationType,
}

impl OperationParameters {
    pub fn validate(&self, current_time: u64) -> Result<()> {
        // Basic parameter validation
        require!(self.amount > 0, ErrorCode::InvalidParameter);
        require!(current_time <= self.deadline, ErrorCode::Timeout);

        // Operation-specific validation
        match self.operation_type {
            OperationType::Transfer | OperationType::Swap => {
                require!(self.recipient.is_some(), ErrorCode::InvalidParameter);
            },
            _ => {}
        }

        // Swap-specific validation
        if self.operation_type == OperationType::Swap {
            require!(
                self.min_output_amount > 0 && 
                self.min_output_amount <= self.max_input_amount,
                ErrorCode::InvalidParameter
            );
        }

        Ok(())
    }

    pub fn check_amount_bounds(&self, min_amount: u64, max_amount: u64) -> Result<()> {
        require!(
            self.amount >= min_amount && self.amount <= max_amount,
            ErrorCode::InvalidParameter
        );
        Ok(())
    }
}
