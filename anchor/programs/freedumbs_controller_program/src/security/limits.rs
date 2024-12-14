use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::modes::OperationMode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeWindow {
    pub start_time: i64,
    pub duration: i64,
    pub operations: u64,
}

impl TimeWindow {
    pub fn new(duration: i64) -> Self {
        Self {
            start_time: 0,
            duration,
            operations: 0,
        }
    }

    pub fn reset(&mut self, current_time: i64) {
        self.start_time = current_time;
        self.operations = 0;
    }

    pub fn update(&mut self, current_time: i64) -> Result<()> {
        if current_time - self.start_time >= self.duration {
            self.reset(current_time);
        }
        self.operations = self.operations.checked_add(1)
            .ok_or(ErrorCode::ArithmeticError)?;
        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum LimitedOperation {
    Mint,
    Burn,
    Transfer,
    Swap,
}

pub struct OperationLimits {
    pub window: TimeWindow,
    pub base_limit: u32,
    pub mode_adjustments: ModeAdjustments,
}

#[derive(Clone, Copy)]
pub struct ModeAdjustments {
    pub normal: u32,      // 100%
    pub defensive: u32,   // 50%
    pub recovery: u32,    // 25%
    pub emergency: u32,   // 10%
}

impl OperationLimits {
    pub fn new(window_duration: i64, base_limit: u32) -> Self {
        Self {
            window: TimeWindow::new(window_duration),
            base_limit,
            mode_adjustments: DEFAULT_MODE_ADJUSTMENTS,
        }
    }

    pub fn check_limit(&mut self, mode: OperationMode) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp;
        
        // Get adjusted limit for current mode
        let limit = self.get_adjusted_limit(mode);
        
        // Check if within limits
        require!(
            self.window.operations < limit as u64,
            ErrorCode::RateLimitExceeded
        );

        // Record operation
        self.window.update(current_time)?;

        Ok(())
    }

    fn get_adjusted_limit(&self, mode: OperationMode) -> u32 {
        let adjustment = match mode {
            OperationMode::Normal => self.mode_adjustments.normal,
            OperationMode::Defensive => self.mode_adjustments.defensive,
            OperationMode::Recovery => self.mode_adjustments.recovery,
            OperationMode::Emergency => self.mode_adjustments.emergency,
            _ => 0,
        };
        
        (self.base_limit as f64 * adjustment as f64 / 100.0) as u32
    }

    pub fn usage_percentage(&self, mode: OperationMode) -> Result<u64> {
        let limit = self.get_adjusted_limit(mode);
        Ok((self.window.operations * 100) / limit as u64)
    }
}

pub struct ProtocolLimits {
    pub mint_limits: OperationLimits,
    pub burn_limits: OperationLimits,
    pub transfer_limits: OperationLimits,
    pub swap_limits: OperationLimits,
}

impl ProtocolLimits {
    pub fn new() -> Self {
        Self {
            mint_limits: OperationLimits::new(LIMIT_CONFIG.mint_window, LIMIT_CONFIG.mint_limit),
            burn_limits: OperationLimits::new(LIMIT_CONFIG.burn_window, LIMIT_CONFIG.burn_limit),
            transfer_limits: OperationLimits::new(LIMIT_CONFIG.transfer_window, LIMIT_CONFIG.transfer_limit),
            swap_limits: OperationLimits::new(LIMIT_CONFIG.swap_window, LIMIT_CONFIG.swap_limit),
        }
    }

    pub fn check_operation(&mut self, operation: LimitedOperation, mode: OperationMode) -> Result<()> {
        require!(mode.can_execute_operations(), ErrorCode::OperationNotAllowed);

        match operation {
            LimitedOperation::Mint => self.mint_limits.check_limit(mode),
            LimitedOperation::Burn => self.burn_limits.check_limit(mode),
            LimitedOperation::Transfer => self.transfer_limits.check_limit(mode),
            LimitedOperation::Swap => self.swap_limits.check_limit(mode),
        }
    }
}

// Configuration
pub const LIMIT_CONFIG: LimitConfig = LimitConfig {
    mint_window: 3600,      // 1 hour
    mint_limit: 1000,
    burn_window: 3600,      // 1 hour
    burn_limit: 1000,
    transfer_window: 1800,  // 30 minutes
    transfer_limit: 2000,
    swap_window: 1800,      // 30 minutes
    swap_limit: 2000,
};

pub const DEFAULT_MODE_ADJUSTMENTS: ModeAdjustments = ModeAdjustments {
    normal: 100,     // 100% of base limit
    defensive: 50,   // 50% of base limit
    recovery: 25,    // 25% of base limit
    emergency: 10,   // 10% of base limit
};

pub struct LimitConfig {
    pub mint_window: i64,
    pub mint_limit: u32,
    pub burn_window: i64,
    pub burn_limit: u32,
    pub transfer_window: i64,
    pub transfer_limit: u32,
    pub swap_window: i64,
    pub swap_limit: u32,
}