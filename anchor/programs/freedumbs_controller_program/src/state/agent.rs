use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;
use crate::state::modes::OperationMode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum AgentType {
    Primary,
    Secondary,
    Observer,
    Emergency,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum AgentActionType {
    Trade,
    Mint,
    Burn,
    Configure,
    Emergency,
    Recovery,
    Maintenance,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct PIDParameters {
    pub kp: u64,              // Proportional term with RATIO_PRECISION
    pub ki: u64,              // Integral term with RATIO_PRECISION
    pub kd: u64,              // Derivative term with RATIO_PRECISION
    pub integral_windup_limit: u64,
    pub last_error: u64,      // Error with PRICE_PRECISION
    pub integral_sum: u64,    // Sum with PRICE_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ActionBounds {
    pub min_amount: u64,      // Raw token amount
    pub max_amount: u64,      // Raw token amount
    pub max_price_impact: u64, // With RATIO_PRECISION
    pub min_price_impact: u64, // With RATIO_PRECISION
    pub time_bounds: TimeBounds,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeBounds {
    pub min_time_between_actions: u64, // Unix timestamp
    pub max_time_between_actions: u64, // Unix timestamp
    pub cooldown_period: u64,          // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PerformanceMetrics {
    pub price_stability_score: u64,    // With RATIO_PRECISION
    pub liquidity_efficiency: u64,     // With RATIO_PRECISION
    pub intervention_frequency: u64,    // With RATIO_PRECISION
    pub action_metrics: ActionMetrics,
    pub response_metrics: ResponseMetrics,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ActionMetrics {
    pub total_actions: u64,
    pub successful_actions: u64,
    pub failed_actions: u64,
    pub success_rate: u64,             // With RATIO_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ResponseMetrics {
    pub average_response_time: u64,    // Unix timestamp
    pub total_volume_handled: u64,     // Raw token amount
    pub error_count: u64,
    pub last_action_timestamp: u64,    // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Emergency,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeTracking {
    pub last_update: u64,              // Unix timestamp
    pub last_action: u64,              // Unix timestamp
    pub cooldown_period: u64,          // Unix timestamp
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AgentConfig {
    pub max_operations: u64,
    pub cooldown_period: u64,          // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MetricWindow {
    pub start_time: u64,
    pub duration: u64,
    pub value: u64,
    pub count: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AgentMetrics {
    pub mint_window: MetricWindow,
    pub burn_window: MetricWindow,
    pub transfer_window: MetricWindow,
    pub swap_window: MetricWindow,
}

#[account]
pub struct Agent {
    // Identity and Authorization
    pub authority: Pubkey,
    pub controller: Pubkey,
    pub agent_type: AgentType,
    pub bump: u8,

    // Control Parameters
    pub pid_parameters: PIDParameters,
    pub action_bounds: ActionBounds,
    
    // Performance Metrics
    pub performance_metrics: PerformanceMetrics,
    
    // State Management
    pub operation_mode: OperationMode,
    pub health_status: HealthStatus,
    pub timing: TimeTracking,
    
    // Flags
    pub permissions: u64,
    pub active_status: bool,
    pub initialized: bool,
    pub metrics: AgentMetrics,
}

impl Agent {
    pub const SPACE: usize = 8 +     // discriminator
        32 +                         // authority
        32 +                         // controller
        1 +                          // agent_type
        1 +                          // bump
        PIDParameters::SIZE +        // pid_parameters
        ActionBounds::SIZE +         // action_bounds
        PerformanceMetrics::SIZE +   // performance_metrics
        1 +                          // operation_mode
        1 +                          // health_status
        TimeTracking::SIZE +         // timing
        8 +                          // permissions
        1 +                          // active_status
        1;                          // initialized

    pub fn update_performance(&mut self, success: bool, volume: u64, timestamp: u64) -> Result<()> {
        let metrics = &mut self.performance_metrics;
        let action_metrics = &mut metrics.action_metrics;
        
        // Update action counts
        if success {
            action_metrics.successful_actions = action_metrics.successful_actions
                .checked_add(1)
                .ok_or(ErrorCode::ArithmeticError)?;
        } else {
            action_metrics.failed_actions = action_metrics.failed_actions
                .checked_add(1)
                .ok_or(ErrorCode::ArithmeticError)?;
        }
        
        action_metrics.total_actions = action_metrics.total_actions
            .checked_add(1)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Update success rate with RATIO_PRECISION
        if action_metrics.total_actions > 0 {
            action_metrics.success_rate = FixedPointCalculator::multiply(
                action_metrics.successful_actions,
                RATIO_PRECISION,
                action_metrics.total_actions
            )?;
        }

        // Update response metrics
        let response_metrics = &mut metrics.response_metrics;
        response_metrics.total_volume_handled = response_metrics.total_volume_handled
            .checked_add(volume)
            .ok_or(ErrorCode::ArithmeticError)?;
        response_metrics.last_action_timestamp = timestamp;

        Ok(())
    }

    pub fn can_perform_action(&self, current_time: u64) -> Result<bool> {
        // Check initialization and active status
        if !self.initialized || !self.active_status {
            return Ok(false);
        }

        // Check operation mode
        if self.operation_mode == OperationMode::Paused {
            return Ok(false);
        }

        // Check timing bounds
        if !self.timing.can_act(current_time) {
            return Ok(false);
        }

        Ok(true)
    }

    pub fn validate_pid_parameters(&self) -> Result<()> {
        // No need to check for negative values with u64
        Ok(())
    }

    pub fn validate_action(&self, action_type: AgentActionType) -> Result<bool> {
        match (self.agent_type, action_type) {
            (AgentType::Primary, _) => Ok(true), // Primary agents can do everything
            (AgentType::Secondary, AgentActionType::Emergency) => Ok(false), // Secondary can't do emergency
            (AgentType::Observer, AgentActionType::Trade | 
                                AgentActionType::Mint | 
                                AgentActionType::Burn) => Ok(false), // Observer can't trade
            (AgentType::Emergency, action) => Ok(matches!(action, 
                AgentActionType::Emergency | 
                AgentActionType::Recovery
            )), // Emergency only emergency/recovery
            _ => Ok(true), // Default allow
        }
    }

    pub fn is_protocol_authority(&self, authority: &Pubkey) -> bool {
        self.authority == *authority
    }

    pub fn is_valid_controller(&self, controller_key: &Pubkey) -> bool {
        self.controller == *controller_key
    }
}

// Size constants for nested structs
impl PIDParameters {
    pub const SIZE: usize = 8 * 6; // 6 i64 fields
}

impl ActionBounds {
    pub const SIZE: usize = 8 * 4 + TimeBounds::SIZE; // 4 u64 fields + TimeBounds
}

impl TimeBounds {
    pub const SIZE: usize = 8 * 3; // 3 i64 fields
}

impl PerformanceMetrics {
    pub const SIZE: usize = 8 * 3 + // 3 i64 fields
        ActionMetrics::SIZE +
        ResponseMetrics::SIZE;
}

impl ActionMetrics {
    pub const SIZE: usize = 8 * 4; // 3 u64 fields + 1 i64
}

impl ResponseMetrics {
    pub const SIZE: usize = 8 * 4; // 1 i64 + 2 u64 + 1 i64
}