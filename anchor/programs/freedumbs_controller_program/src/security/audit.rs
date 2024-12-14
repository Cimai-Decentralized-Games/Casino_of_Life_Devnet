use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{
    modes::OperationMode,
    agent::Agent,
    treasury::Treasury,
    market::MarketState,
};

#[derive(Clone, Copy, PartialEq)]
pub enum AuditedOperation {
    Mint,
    Burn,
    Transfer,
    Swap,
}

pub struct OperationAuditor;

impl OperationAuditor {
    pub fn audit_operation(
        operation: AuditedOperation,
        agent: &mut Account<Agent>,
        treasury: &Account<Treasury>,
        market: &Account<MarketState>,
        params: &OperationParameters,
    ) -> Result<()> {
        // 1. Check operation permissions
        Self::check_operation_permissions(operation, agent, treasury, market)?;

        // 2. Verify operation bounds
        Self::check_operation_bounds(operation, params)?;

        // 3. Verify timing constraints
        Self::check_timing_constraints(operation, agent, treasury, market)?;

        // 4. Record operation metrics
        Self::record_operation_metrics(operation, agent, params)?;

        Ok(())
    }

    fn check_operation_permissions(
        operation: AuditedOperation,
        agent: &Account<Agent>,
        treasury: &Account<Treasury>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        // Check basic operational status
        require!(
            agent.operation_mode.can_execute_operations() &&
            treasury.operation_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );

        // Operation-specific checks
        match operation {
            AuditedOperation::Mint => {
                require!(
                    !treasury.operation_mode.is_emergency(),
                    ErrorCode::EmergencyModeActive
                );
            },
            AuditedOperation::Burn => {
                require!(
                    !treasury.operation_mode.is_paused(),
                    ErrorCode::OperationPaused
                );
            },
            _ => {}
        }

        Ok(())
    }

    fn check_operation_bounds(
        operation: AuditedOperation,
        params: &OperationParameters,
    ) -> Result<()> {
        match operation {
            AuditedOperation::Mint => {
                require!(
                    params.amount >= OPERATION_BOUNDS.min_mint_amount &&
                    params.amount <= OPERATION_BOUNDS.max_mint_amount &&
                    params.slippage <= OPERATION_BOUNDS.max_slippage,
                    ErrorCode::InvalidParameter
                );
            },
            AuditedOperation::Burn => {
                require!(
                    params.amount >= OPERATION_BOUNDS.min_burn_amount &&
                    params.amount <= OPERATION_BOUNDS.max_burn_amount &&
                    params.slippage <= OPERATION_BOUNDS.max_slippage,
                    ErrorCode::InvalidParameter
                );
            },
            AuditedOperation::Transfer => {
                require!(
                    params.amount <= OPERATION_BOUNDS.max_transfer_amount,
                    ErrorCode::InvalidParameter
                );
            },
            AuditedOperation::Swap => {
                require!(
                    params.slippage <= OPERATION_BOUNDS.max_swap_slippage,
                    ErrorCode::InvalidParameter
                );
            },
        }
        Ok(())
    }

    fn check_timing_constraints(
        operation: AuditedOperation,
        agent: &Account<Agent>,
        treasury: &Account<Treasury>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        
        // Check agent timing
        require!(
            agent.timing.can_act(current_time),
            ErrorCode::Timeout
        );

        // Check market hours
        if MARKET_HOURS_ENABLED {
            require!(
                Self::is_within_market_hours(current_time)?,
                ErrorCode::OutsideMarketHours
            );
        }

        // Operation-specific timing
        match operation {
            AuditedOperation::Mint | AuditedOperation::Burn => {
                require!(
                    treasury.timing.can_act(current_time),
                    ErrorCode::TreasuryTimeout
                );
            },
            AuditedOperation::Swap => {
                require!(
                    market.timing.last_update <= current_time,
                    ErrorCode::MarketTimeout
                );
            },
            _ => {}
        }

        Ok(())
    }

    fn record_operation_metrics(
        operation: AuditedOperation,
        agent: &mut Account<Agent>,
        params: &OperationParameters,
    ) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        
        match operation {
            AuditedOperation::Mint => {
                agent.metrics.mint_window.value = agent.metrics.mint_window.value
                    .checked_add(params.amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.mint_window.count = agent.metrics.mint_window.count
                    .checked_add(1)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.mint_window.start_time = current_time;
            },
            AuditedOperation::Burn => {
                agent.metrics.burn_window.value = agent.metrics.burn_window.value
                    .checked_add(params.amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.burn_window.count = agent.metrics.burn_window.count
                    .checked_add(1)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.burn_window.start_time = current_time;
            },
            AuditedOperation::Transfer => {
                agent.metrics.transfer_window.value = agent.metrics.transfer_window.value
                    .checked_add(params.amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.transfer_window.count = agent.metrics.transfer_window.count
                    .checked_add(1)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.transfer_window.start_time = current_time;
            },
            AuditedOperation::Swap => {
                agent.metrics.swap_window.value = agent.metrics.swap_window.value
                    .checked_add(params.amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.swap_window.count = agent.metrics.swap_window.count
                    .checked_add(1)
                    .ok_or(ErrorCode::ArithmeticError)?;
                agent.metrics.swap_window.start_time = current_time;
            },
        }

        Ok(())
    }

    fn is_within_market_hours(timestamp: u64) -> Result<bool> {
        let seconds_in_day = timestamp % 86400;
        Ok(seconds_in_day >= MARKET_OPEN_TIME && seconds_in_day <= MARKET_CLOSE_TIME)
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct OperationParameters {
    pub amount: u64,
    pub slippage: u64,
}

pub const OPERATION_BOUNDS: OperationBounds = OperationBounds {
    max_mint_amount: 1_000_000,
    min_mint_amount: 100,
    max_burn_amount: 1_000_000,
    min_burn_amount: 100,
    max_transfer_amount: 500_000,
    max_slippage: 300,  // 3%
    max_swap_slippage: 500,  // 5%
};

pub struct OperationBounds {
    pub max_mint_amount: u64,
    pub min_mint_amount: u64,
    pub max_burn_amount: u64,
    pub min_burn_amount: u64,
    pub max_transfer_amount: u64,
    pub max_slippage: u64,
    pub max_swap_slippage: u64,
}

const MARKET_HOURS_ENABLED: bool = true;
const MARKET_OPEN_TIME: u64 = 32400;  // 9:00 AM in seconds
const MARKET_CLOSE_TIME: u64 = 57600; // 4:00 PM in seconds