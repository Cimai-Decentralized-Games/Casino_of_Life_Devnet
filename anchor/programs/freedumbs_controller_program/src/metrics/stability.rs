use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, constants::*};
use crate::errors::ErrorCode;

pub struct StabilityMetricsCalculator;

impl StabilityMetricsCalculator {
    pub fn calculate_price_stability_score(
        price_history: &[u64],
        target_price: u64,
        time_window: u64
    ) -> Result<u64> {
        // Calculate mean deviation from target
        let mean_deviation = Self::calculate_mean_deviation(price_history, target_price)?;
        
        // Calculate volatility component
        let volatility = Self::calculate_volatility_component(price_history, time_window)?;
        
        // Combine metrics into stability score
        FixedPointCalculator::calculate_stability_score(
            mean_deviation,
            volatility,
            time_window
        )
    }

    pub fn calculate_confidence_score(
        stability_score: u64,
        reserve_ratio: u64,
        volume_depth: u64
    ) -> Result<u64> {
        // Weight factors for different components
        let stability_weight = 4;
        let reserve_weight = 3;
        let volume_weight = 3;

        // Calculate weighted average using u64 values and weights
        FixedPointCalculator::calculate_weighted_average(&[
            (stability_score, stability_weight),
            (reserve_ratio, reserve_weight),
            (volume_depth, volume_weight),
        ])
    }

    fn calculate_mean_deviation(
        price_history: &[u64],
        target_price: u64
    ) -> Result<u64> {
        if price_history.is_empty() {
            return Err(ErrorCode::InsufficientPriceHistory.into());
        }

        let deviations: Result<Vec<u64>> = price_history
            .iter()
            .map(|&price| {
                FixedPointCalculator::calculate_deviation(
                    price,
                    target_price
                )
            })
            .collect();

        FixedPointCalculator::calculate_mean(&deviations?)
    }

    fn calculate_volatility_component(
        price_history: &[u64],
        time_window: u64
    ) -> Result<u64> {
        if price_history.len() < 2 {
            return Err(ErrorCode::InsufficientPriceHistory.into());
        }

        let returns: Result<Vec<u64>> = price_history
            .windows(2)
            .map(|window| {
                FixedPointCalculator::calculate_return(
                    window[1], // current
                    window[0]  // previous
                )
            })
            .collect();

        FixedPointCalculator::calculate_volatility(
            &returns?,
            time_window
        )
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct StabilityMetrics {
    pub price_stability_score: u64,  // With RATIO_PRECISION
    pub confidence_score: u64,       // With RATIO_PRECISION
    pub last_update_slot: u64,       // Slot number
    pub measurement_period: u64,     // Number of slots
}

impl StabilityMetrics {
    pub fn update(
        &mut self,
        price_history: &[u64],
        target_price: u64,
        reserve_ratio: u64,
        volume_depth: u64,
    ) -> Result<()> {
        self.price_stability_score = StabilityMetricsCalculator::calculate_price_stability_score(
            price_history,
            target_price,
            self.measurement_period
        )?;

        self.confidence_score = StabilityMetricsCalculator::calculate_confidence_score(
            self.price_stability_score,
            reserve_ratio,
            volume_depth
        )?;

        self.last_update_slot = Clock::get()?.slot;
        Ok(())
    }
}