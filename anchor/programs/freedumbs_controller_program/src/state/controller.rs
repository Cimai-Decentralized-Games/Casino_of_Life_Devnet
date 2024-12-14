use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;
use crate::state::modes::OperationMode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeTracking {
    pub last_update: u64,          // Unix timestamp
    pub last_action: u64,          // Unix timestamp
    pub cooldown_period: u64,      // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ControllerType {
    MainNet,        // Production controller
    TestNet,        // Testing controller
    Simulation,     // Simulation only
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ControllerState {
    // Current State
    pub current_mode: OperationMode,
    pub target_price: u64,         // With PRICE_PRECISION
    pub price_band_upper: u64,     // With PRICE_PRECISION
    pub price_band_lower: u64,     // With PRICE_PRECISION
    pub last_price: u64,           // With PRICE_PRECISION
    pub last_update: u64,          // Unix timestamp
    
    // Market State Assessment
    pub market_volatility: u64,    // With RATIO_PRECISION
    pub market_direction: u64,     // With RATIO_PRECISION
    pub confidence_level: u64,     // With RATIO_PRECISION
    
    // Control Signals
    pub mint_signal: u64,          // With RATIO_PRECISION
    pub burn_signal: u64,          // With RATIO_PRECISION
    pub curve_adjustment_signal: u64, // With RATIO_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ControlParameters {
    // PID Parameters
    pub kp: u64,                   // With RATIO_PRECISION
    pub ki: u64,                   // With RATIO_PRECISION
    pub kd: u64,                   // With RATIO_PRECISION
    
    // Response Parameters
    pub response_speed: u64,       // With RATIO_PRECISION
    pub damping_factor: u64,       // With RATIO_PRECISION
    
    // Limits and Thresholds
    pub max_spread: u64,           // With RATIO_PRECISION
    pub min_transaction_size: u64, // Raw token amount
    pub max_transaction_size: u64, // Raw token amount
    pub min_stability_threshold: u64, // With RATIO_PRECISION
    
    // Time Windows
    pub analysis_window: u64,      // Unix timestamp
    pub action_delay: u64,         // Unix timestamp
    pub recovery_period: u64,      // Unix timestamp
}

impl Default for ControlParameters {
    fn default() -> Self {
        Self {
            kp: 0,
            ki: 0,
            kd: 0,
            response_speed: 0,
            damping_factor: 0,
            max_spread: 0,
            min_transaction_size: 0,
            max_transaction_size: 0,
            min_stability_threshold: 7000, // 70% minimum stability required by default
            analysis_window: 0,
            action_delay: 0,
            recovery_period: 0,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct HealthMetrics {
    pub price_stability_score: u64, // With RATIO_PRECISION
    pub volume_efficiency: u64,     // With RATIO_PRECISION
    pub control_effectiveness: u64, // With RATIO_PRECISION
    pub cumulative_error: u64,      // With PRICE_PRECISION
    pub error_rate: u64,            // With RATIO_PRECISION
    pub last_error_timestamp: u64,  // Unix timestamp
    pub system_uptime: u64,         // Unix timestamp
    pub successful_actions: u64,
    pub failed_actions: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ControlActionType {
    EmergencyAction,
    SystemRecovery,
    UpdateParameters,
    MarketOperations,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ControlLimits {
    pub max_leverage: u64,         // With RATIO_PRECISION
    pub min_collateral: u64,       // Raw token amount
    pub max_drawdown: u64,         // With RATIO_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ControllerConfig {
    pub max_leverage: u64,         // With RATIO_PRECISION
    pub min_collateral: u64,       // Raw token amount
    pub max_drawdown: u64,         // With RATIO_PRECISION
}

#[account]
pub struct Controller {
    // Identity and Authorization
    pub authority: Pubkey,
    pub treasury: Pubkey,
    pub controller_type: ControllerType,
    pub bump: u8,

    // Controller State
    pub controller_state: ControllerState,
    pub control_parameters: ControlParameters,
    
    // Performance and Health
    pub health_metrics: HealthMetrics,
    pub timing: TimeTracking,
    
    // Operational Parameters
    pub max_transaction_amount: u64, // Raw token amount
    pub fee_basis_points: u64,       // With FEE_PRECISION
    pub initialized: bool,
}

impl Controller {
    pub const SPACE: usize = 8 +     // discriminator
        32 +                         // authority
        32 +                         // treasury
        1 +                          // controller_type
        1 +                          // bump
        ControllerState::SIZE +      // controller_state
        ControlParameters::SIZE +    // control_parameters
        HealthMetrics::SIZE +        // health_metrics
        TimeTracking::SIZE +         // timing
        8 +                          // max_transaction_amount
        8 +                          // fee_basis_points
        1;                           // initialized

    pub fn update_health_metrics(&mut self, action_success: bool) -> Result<()> {
        let metrics = &mut self.health_metrics;
        let clock = Clock::get()?;
        
        if action_success {
            metrics.successful_actions = metrics.successful_actions
                .checked_add(1)
                .ok_or(ErrorCode::ArithmeticError)?;
        } else {
            metrics.failed_actions = metrics.failed_actions
                .checked_add(1)
                .ok_or(ErrorCode::ArithmeticError)?;
            metrics.last_error_timestamp = clock.unix_timestamp as u64;
        }

        // Update effectiveness metrics with RATIO_PRECISION
        let total_actions = metrics.successful_actions + metrics.failed_actions;
        if total_actions > 0 {
            metrics.control_effectiveness = FixedPointCalculator::multiply(
                metrics.successful_actions,
                RATIO_PRECISION,
                total_actions
            )?;
        }

        Ok(())
    }

    pub fn can_execute_action(&self, current_time: u64) -> Result<bool> {
        if !self.initialized {
            return Ok(false);
        }

        if self.controller_state.current_mode == OperationMode::Paused {
            return Ok(false);
        }

        if !self.timing.can_act(current_time) {
            return Ok(false);
        }

        Ok(true)
    }

    pub fn is_valid_agent(&self, agent_key: &Pubkey) -> bool {
        self.authority == *agent_key
    }

    pub fn is_valid_treasury(&self, treasury_key: &Pubkey) -> bool {
        self.treasury == *treasury_key
    }
}

// Size constants
impl ControllerState {
    pub const SIZE: usize = 8 * 12; // 12 u64 fields
}

impl ControlParameters {
    pub const SIZE: usize = 8 * 12; // Updated to 12 fields (all u64)
}

impl HealthMetrics {
    pub const SIZE: usize = 8 * 9; // 9 u64 fields
}

impl TimeTracking {
    pub const SIZE: usize = 8 * 3; // 3 u64 fields

    pub fn can_act(&self, current_time: u64) -> bool {
        current_time.saturating_sub(self.last_action) >= self.cooldown_period
    }

    pub fn update(&mut self, current_time: u64) {
        self.last_update = current_time;
        self.last_action = current_time;
    }
}