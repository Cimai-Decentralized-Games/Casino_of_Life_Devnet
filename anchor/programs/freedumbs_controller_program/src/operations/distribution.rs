use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    treasury::{Treasury, FeeConfig},
    market::MarketState,
    agent::Agent,
};
use crate::errors::ErrorCode;
use crate::math::{FixedPointCalculator, constants::*};

pub struct DistributionOperation;

impl DistributionOperation {
    pub fn execute(
        treasury: &mut Account<Treasury>,
        market: &Account<MarketState>,
        agent: &mut Account<Agent>,
    ) -> Result<()> {
        // Validate conditions first
        Self::validate_conditions(treasury, market)?;

        // Calculate distribution amounts
        let total_fees = treasury.distribution_metrics.accumulated_fees;

        // Check minimum distribution amount
        require!(
            total_fees >= treasury.treasury_config.min_distribution_amount,
            ErrorCode::InsufficientFeesForDistribution
        );

        let distribution_shares = Self::calculate_distribution_shares(
            total_fees,
            &treasury.fee_config
        )?;

        // Process distributions
        treasury.distribute_fees(agent)?;

        // Update metrics
        treasury.distribution_metrics.total_distributed_fees = treasury
            .distribution_metrics
            .total_distributed_fees
            .checked_add(distribution_shares.total())
            .ok_or(ErrorCode::ArithmeticError)?;
        
        let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();
        treasury.distribution_metrics.last_distribution = current_time;
        treasury.distribution_metrics.distribution_count += 1;

        // Update agent performance metrics
        agent.update_performance(
            true,
            distribution_shares.agent_share,
            current_time
        )?;

        Ok(())
    }

    pub fn validate_conditions(
        treasury: &Account<Treasury>,
        market: &Account<MarketState>,
    ) -> Result<()> {
        // Check operation mode
        require!(
            treasury.operation_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );

        let current_time = Clock::get()?.unix_timestamp as u64;

        // Check distribution timing
        require!(
            current_time >= treasury.distribution_metrics.last_distribution + treasury.treasury_config.distribution_frequency,
            ErrorCode::CooldownNotMet
        );

        // Check minimum fee threshold
        require!(
            treasury.distribution_metrics.accumulated_fees 
                >= treasury.treasury_config.min_distribution_amount,
            ErrorCode::InsufficientFeesForDistribution
        );

        Ok(())
    }

    fn calculate_distribution_shares(
        total_amount: u64,
        fee_config: &FeeConfig,
    ) -> Result<DistributionShares> {
        let protocol_share = FixedPointCalculator::multiply(
            total_amount,
            fee_config.protocol_fee_rate,
            FEE_PRECISION
        )?;

        let agent_share = FixedPointCalculator::multiply(
            total_amount,
            fee_config.agent_fee_rate,
            FEE_PRECISION
        )?;

        Ok(DistributionShares {
            protocol_share,
            agent_share,
        })
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct DistributionShares {
    pub protocol_share: u64,
    pub agent_share: u64,
}

impl DistributionShares {
    pub fn total(&self) -> u64 {
        self.protocol_share
            .saturating_add(self.agent_share)
    }
}