use anchor_lang::prelude::*;
use crate::math::{FeeCalculator, RatioCalculator, constants::*};
use crate::state::agent::Agent;
use crate::errors::ErrorCode;
use crate::state::modes::OperationMode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Warning,
    Critical,
    Emergency,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeTracking {
    pub last_update: u64,          // Unix timestamp
    pub last_action: u64,          // Unix timestamp
    pub cooldown_period: u64,      // Unix timestamp
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TreasuryConfig {
    pub min_reserve_ratio: u64,    // With RATIO_PRECISION
    pub target_reserve_ratio: u64, // With RATIO_PRECISION
    pub max_reserve_ratio: u64,    // With RATIO_PRECISION
    pub emergency_threshold: u64,  // With RATIO_PRECISION
    pub distribution_frequency: u64, // Unix timestamp
    pub min_distribution_amount: u64, // Raw token amount
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct FeeConfig {
    pub protocol_fee_rate: u64,    // With FEE_PRECISION
    pub agent_fee_rate: u64,       // With FEE_PRECISION
    pub protocol_share: u64,       // With RATIO_PRECISION
    pub agent_share: u64,          // With RATIO_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct ReserveMetrics {
    pub total_reserves: u64,       // Raw token amount
    pub current_reserves: u64,     // Raw token amount
    pub minimum_reserves: u64,     // Raw token amount
    pub target_reserves: u64,      // Raw token amount
    pub reserve_ratio: u64,        // With RATIO_PRECISION
    pub target_reserve_ratio: u64, // With RATIO_PRECISION
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct DistributionMetrics {
    pub accumulated_fees: u64,     // Raw token amount
    pub total_distributed_fees: u64, // Raw token amount
    pub distribution_count: u64,
    pub last_distribution: u64,    // Unix timestamp
    pub total_volume: u64,         // Raw token amount
}

#[account]
pub struct Treasury {
    // Authority and Configuration
    pub authority: Pubkey,
    pub agent: Pubkey,
    pub bump: u8,

    // Configurations
    pub treasury_config: TreasuryConfig,
    pub fee_config: FeeConfig,

    // Metrics
    pub reserve_metrics: ReserveMetrics,
    pub distribution_metrics: DistributionMetrics,

    // State Management
    pub health_status: HealthStatus,
    pub operation_mode: OperationMode,
    pub timing: TimeTracking,

    // Flags
    pub is_buying: bool,
    pub is_frozen: bool,
    pub emergency_active: bool,
}

impl Treasury {
    pub const SPACE: usize = 8 +     // discriminator
        32 +                         // authority
        32 +                         // agent
        1 +                          // bump
        TreasuryConfig::SIZE +       // treasury_config
        FeeConfig::SIZE +            // fee_config
        ReserveMetrics::SIZE +       // reserve_metrics
        DistributionMetrics::SIZE +  // distribution_metrics
        1 +                          // health_status
        1 +                          // operation_mode
        TimeTracking::SIZE +         // timing
        1 +                          // is_buying
        1 +                          // is_frozen
        1;                           // emergency_active

    pub fn is_valid_controller(&self, controller_key: &Pubkey) -> bool {
        self.authority == *controller_key
    }

    pub fn is_valid_agent(&self, agent_key: &Pubkey) -> bool {
        self.agent == *agent_key
    }

    pub fn can_process_transaction(&self, amount: u64) -> Result<bool> {
        if self.is_frozen || self.emergency_active {
            return Ok(false);
        }

        let new_reserves = self.reserve_metrics.total_reserves
            .checked_sub(amount)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        let new_ratio = RatioCalculator::calculate_reserve_ratio(
            new_reserves,
            self.distribution_metrics.total_volume
        )?;
        
        Ok(new_ratio >= self.treasury_config.min_reserve_ratio)
    }

    pub fn update_reserves(&mut self, amount: u64, is_increase: bool) -> Result<()> {
        let metrics = &mut self.reserve_metrics;
        
        metrics.total_reserves = if is_increase {
            metrics.total_reserves
                .checked_add(amount)
                .ok_or(ErrorCode::ArithmeticError)?
        } else {
            metrics.total_reserves
                .checked_sub(amount)
                .ok_or(ErrorCode::ArithmeticError)?
        };

        metrics.reserve_ratio = RatioCalculator::calculate_reserve_ratio(
            metrics.total_reserves,
            self.distribution_metrics.total_volume
        )?;

        // Update health status based on new ratio
        self.update_health_status()?;

        Ok(())
    }

    pub fn collect_fees(&mut self, transaction_amount: u64) -> Result<()> {
        let protocol_fee = FeeCalculator::calculate_fee(
            transaction_amount,
            self.fee_config.protocol_fee_rate
        )?;
        
        let agent_fee = FeeCalculator::calculate_fee(
            transaction_amount,
            self.fee_config.agent_fee_rate
        )?;

        let metrics = &mut self.distribution_metrics;
        
        metrics.accumulated_fees = metrics.accumulated_fees
            .checked_add(protocol_fee)
            .and_then(|sum| sum.checked_add(agent_fee))
            .ok_or(ErrorCode::ArithmeticError)?;

        metrics.total_volume = metrics.total_volume
            .checked_add(transaction_amount)
            .ok_or(ErrorCode::ArithmeticError)?;

        Ok(())
    }

    pub fn distribute_fees(&mut self, agent: &mut Account<Agent>) -> Result<()> {
        let metrics = &mut self.distribution_metrics;
        let current_time = Clock::get()?.unix_timestamp as u64;
        
        require!(
            current_time.saturating_sub(metrics.last_distribution) >= self.treasury_config.distribution_frequency,
            ErrorCode::TooEarlyForDistribution
        );

        require!(
            metrics.accumulated_fees >= self.treasury_config.min_distribution_amount,
            ErrorCode::InsufficientFeesForDistribution
        );

        let protocol_share = FeeCalculator::calculate_protocol_share(
            metrics.accumulated_fees,
            self.fee_config.protocol_share
        )?;
        
        let agent_share = FeeCalculator::calculate_agent_share(
            metrics.accumulated_fees,
            self.fee_config.agent_share
        )?;

        // Update metrics
        metrics.accumulated_fees = 0;
        metrics.last_distribution = current_time;
        metrics.total_distributed_fees = metrics.total_distributed_fees
            .checked_add(protocol_share)
            .and_then(|sum| sum.checked_add(agent_share))
            .ok_or(ErrorCode::ArithmeticError)?;
        metrics.distribution_count += 1;

        // Update agent performance metrics
        agent.update_performance(true, agent_share, current_time)?;

        Ok(())
    }

    fn update_health_status(&mut self) -> Result<()> {
        self.health_status = if self.reserve_metrics.reserve_ratio < self.treasury_config.emergency_threshold {
            self.emergency_active = true;
            self.is_frozen = true;
            HealthStatus::Emergency
        } else if self.reserve_metrics.reserve_ratio < self.treasury_config.min_reserve_ratio {
            HealthStatus::Critical
        } else if self.reserve_metrics.reserve_ratio < self.treasury_config.target_reserve_ratio {
            HealthStatus::Warning
        } else {
            HealthStatus::Healthy
        };

        Ok(())
    }

    pub fn process_mint(&mut self, amount: u64) -> Result<()> {
        // Check if we can process the transaction
        require!(
            self.can_process_transaction(amount)?,
            ErrorCode::InsufficientReserves
        );

        // Update reserves (increase)
        self.update_reserves(amount, true)?;

        // Collect fees
        self.collect_fees(amount)?;

        Ok(())
    }

    pub fn process_burn(&mut self, amount: u64) -> Result<()> {
        // Check if we can process the transaction
        require!(
            self.can_process_transaction(amount)?,
            ErrorCode::InsufficientReserves
        );

        // Update reserves (decrease)
        self.update_reserves(amount, false)?;

        // Collect fees
        self.collect_fees(amount)?;

        Ok(())
    }

    pub fn process_fee_distribution(&mut self, agent: &mut Account<Agent>) -> Result<()> {
        self.distribute_fees(agent)
    }

    pub fn needs_rebalance(&self) -> Result<bool> {
        Ok(self.reserve_metrics.reserve_ratio < self.treasury_config.target_reserve_ratio)
    }

    pub fn execute_rebalance(&mut self, current_price: u64) -> Result<()> {
        // Calculate target reserves based on current price
        let target_reserves = self.reserve_metrics.target_reserves;
        
        if self.reserve_metrics.total_reserves < target_reserves {
            // Need to increase reserves
            let amount = target_reserves
                .checked_sub(self.reserve_metrics.total_reserves)
                .ok_or(ErrorCode::ArithmeticError)?;
            self.update_reserves(amount, true)?;
        } else {
            // Need to decrease reserves
            let amount = self.reserve_metrics.total_reserves
                .checked_sub(target_reserves)
                .ok_or(ErrorCode::ArithmeticError)?;
            self.update_reserves(amount, false)?;
        }

        Ok(())
    }
}

// Size constants for nested structs
impl TreasuryConfig {
    pub const SIZE: usize = 8 * 4 + 8 * 2; // 4 u64s + 2 u64s
}

impl FeeConfig {
    pub const SIZE: usize = 8 * 4; // 4 u64s
}

impl ReserveMetrics {
    pub const SIZE: usize = 8 * 6; // 6 u64s
}

impl DistributionMetrics {
    pub const SIZE: usize = 8 * 5; // 5 u64s
}

impl TimeTracking {
    pub const SIZE: usize = 8 * 3; // 3 u64s

    pub fn can_act(&self, current_time: u64) -> bool {
        current_time.saturating_sub(self.last_action) >= self.cooldown_period
    }

    pub fn update(&mut self, current_time: u64) {
        self.last_update = current_time;
        self.last_action = current_time;
    }
}

impl Default for TimeTracking {
    fn default() -> Self {
        Self {
            last_update: 0,
            last_action: 0,
            cooldown_period: 0,
        }
    }
}

impl Default for Treasury {
    fn default() -> Self {
        Self {
            authority: Pubkey::default(),
            agent: Pubkey::default(),
            bump: 0,
            treasury_config: TreasuryConfig {
                min_reserve_ratio: 0,
                target_reserve_ratio: 0,
                max_reserve_ratio: 0,
                emergency_threshold: 0,
                distribution_frequency: 0,
                min_distribution_amount: 0,
            },
            fee_config: FeeConfig {
                protocol_fee_rate: 0,
                agent_fee_rate: 0,
                protocol_share: 0,
                agent_share: 0,
            },
            reserve_metrics: ReserveMetrics {
                total_reserves: 0,
                current_reserves: 0,
                minimum_reserves: 0,
                target_reserves: 0,
                reserve_ratio: 0,
                target_reserve_ratio: 0,
            },
            distribution_metrics: DistributionMetrics {
                accumulated_fees: 0,
                total_distributed_fees: 0,
                distribution_count: 0,
                last_distribution: 0,
                total_volume: 0,
            },
            health_status: HealthStatus::Healthy,
            operation_mode: OperationMode::Normal,
            timing: TimeTracking::default(),
            is_buying: false,
            is_frozen: false,
            emergency_active: false,
        }
    }
}