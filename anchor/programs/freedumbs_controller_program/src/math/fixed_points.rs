use anchor_lang::prelude::*;
use fixed::types::U64F64;
use crate::errors::ErrorCode;
use crate::math::constants::*;

pub struct FixedPointCalculator;

impl FixedPointCalculator {
    pub fn to_fixed(value: u64) -> Result<U64F64> {
        Ok(U64F64::from_num(value))
    }

    pub fn from_fixed(value: U64F64) -> Result<u64> {
        Ok(value.to_num())
    }

    pub fn multiply(a: u64, b: u64, precision: u64) -> Result<u64> {
        let a_fixed = Self::to_fixed(a)?;
        let b_fixed = Self::to_fixed(b)?;
        let precision_fixed = Self::to_fixed(precision)?;
        
        let result = (a_fixed * b_fixed) / precision_fixed;
        Self::from_fixed(result)
    }

    pub fn divide(a: u64, b: u64, precision: u64) -> Result<u64> {
        require!(b != 0, ErrorCode::DivisionByZero);
        
        let a_fixed = Self::to_fixed(a)?;
        let b_fixed = Self::to_fixed(b)?;
        let precision_fixed = Self::to_fixed(precision)?;
        
        let result = (a_fixed * precision_fixed) / b_fixed;
        Self::from_fixed(result)
    }

    pub fn calculate_mint_amount(
        input_amount: u64,
        mint_multiplier: u64,
        slope: u64,
        current_price: u64,
        target_price: u64
    ) -> Result<u64> {
        let price_diff = Self::calculate_deviation(current_price, target_price)?;
        let adjusted_multiplier = Self::multiply(
            mint_multiplier,
            slope,
            RATIO_PRECISION
        )?;
        
        Self::multiply(
            input_amount,
            adjusted_multiplier,
            PRICE_PRECISION
        )
    }

    pub fn calculate_burn_amount(
        output_amount: u64,
        burn_multiplier: u64,
        slope: u64,
        current_price: u64,
        target_price: u64
    ) -> Result<u64> {
        let price_diff = Self::calculate_deviation(current_price, target_price)?;
        let adjusted_multiplier = Self::multiply(
            burn_multiplier,
            slope,
            RATIO_PRECISION
        )?;
        
        Self::multiply(
            output_amount,
            adjusted_multiplier,
            PRICE_PRECISION
        )
    }

    pub fn calculate_mean(values: &[u64]) -> Result<u64> {
        require!(!values.is_empty(), ErrorCode::InvalidCalculation);
        
        let sum: u64 = values.iter().sum();
        Self::divide(sum, values.len() as u64, 1)
    }

    pub fn calculate_deviation(value: u64, mean: u64) -> Result<u64> {
        Ok(if value > mean {
            value.saturating_sub(mean)
        } else {
            mean.saturating_sub(value)
        })
    }

    pub fn calculate_volatility(returns: &[u64], mean: u64) -> Result<u64> {
        require!(!returns.is_empty(), ErrorCode::InvalidCalculation);
        
        let squared_deviations: Result<Vec<u64>> = returns
            .iter()
            .map(|&r| {
                let deviation = Self::calculate_deviation(r, mean)?;
                Self::multiply(deviation, deviation, RATIO_PRECISION)
            })
            .collect();

        let variance = Self::calculate_mean(&squared_deviations?)?;
        
        // Square root approximation using binary search
        Self::sqrt(variance)
    }

    pub fn calculate_return(current: u64, previous: u64) -> Result<u64> {
        require!(previous != 0, ErrorCode::DivisionByZero);
        
        let diff = current.checked_sub(previous)
            .ok_or(ErrorCode::ArithmeticError)?;
            
        Self::divide(diff, previous, RATIO_PRECISION)
    }

    pub fn calculate_reserve_ratio(numerator: u64, denominator: u64) -> Result<u64> {
        require!(denominator != 0, ErrorCode::DivisionByZero);
        Self::divide(numerator, denominator, RATIO_PRECISION)
    }

    pub fn adjust_curve_rates(
        base_rates: crate::state::curve::CurveRates,
        volatility: u64,
        liquidity: u64,
        limits: (u64, u64)
    ) -> Result<crate::state::curve::CurveRates> {
        let (min_rate, max_rate) = limits;
        
        let adjusted_mint = Self::multiply(
            base_rates.mint_multiplier,
            volatility,
            RATIO_PRECISION
        )?;
        
        let adjusted_burn = Self::multiply(
            base_rates.burn_multiplier,
            volatility,
            RATIO_PRECISION
        )?;
        
        Ok(crate::state::curve::CurveRates {
            mint_multiplier: adjusted_mint.clamp(min_rate, max_rate),
            burn_multiplier: adjusted_burn.clamp(min_rate, max_rate),
            slippage_multiplier: base_rates.slippage_multiplier,
            fee_multiplier: base_rates.fee_multiplier,
        })
    }

    // Helper function for square root calculation using binary search
    fn sqrt(value: u64) -> Result<u64> {
        if value == 0 {
            return Ok(0);
        }

        let mut left = 0u64;
        let mut right = value;
        
        while left <= right {
            let mid = (left + right) / 2;
            let mid_squared = mid.checked_mul(mid)
                .ok_or(ErrorCode::ArithmeticError)?;
            
            if mid_squared == value {
                return Ok(mid);
            } else if mid_squared < value {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        
        Ok(right) // Return closest approximation
    }

    pub fn calculate_market_impact(
        operation_size: u64,
        liquidity_depth: u64,
        slippage_factor: u64
    ) -> Result<u64> {
        let impact = Self::multiply(operation_size, slippage_factor, RATIO_PRECISION)?;
        Self::divide(impact, liquidity_depth, RATIO_PRECISION)
    }

    pub fn calculate_stability_score(
        deviation: u64,
        volatility: u64,
        time_window: u64
    ) -> Result<u64> {
        let weighted_deviation = Self::multiply(deviation, time_window, RATIO_PRECISION)?;
        Self::divide(weighted_deviation, volatility, RATIO_PRECISION)
    }

    pub fn annualize_volatility(
        variance: u64,
        time_window: u64,
        annualization_factor: u64
    ) -> Result<u64> {
        let annualized_variance = Self::multiply(variance, annualization_factor, RATIO_PRECISION)?;
        Self::divide(annualized_variance, time_window, RATIO_PRECISION)
    }

    pub fn calculate_liquidity_depth(
        reserve_amount: u64,
        current_price: u64,
        market_cap: u64
    ) -> Result<u64> {
        let depth = Self::multiply(reserve_amount, current_price, RATIO_PRECISION)?;
        Self::divide(depth, market_cap, RATIO_PRECISION)
    }

    pub fn calculate_variance(values: &[u64], mean: u64) -> Result<u64> {
        let squared_deviations: Result<Vec<u64>> = values
            .iter()
            .map(|&value| {
                let deviation = Self::calculate_deviation(value, mean)?;
                Self::multiply(deviation, deviation, RATIO_PRECISION)
            })
            .collect();

        Self::calculate_mean(&squared_deviations?)
    }

    pub fn calculate_market_cap(
        total_supply: u64,
        current_price: u64
    ) -> Result<u64> {
        Self::multiply(
            total_supply,
            current_price,
            PRICE_PRECISION
        )
    }

    pub fn calculate_weighted_average(
        values_and_weights: &[(u64, u64)]
    ) -> Result<u64> {
        require!(!values_and_weights.is_empty(), ErrorCode::InvalidCalculation);
        
        let mut weighted_sum = 0u64;
        let mut weight_sum = 0u64;
        
        for (value, weight) in values_and_weights {
            let weighted_value = Self::multiply(*value, *weight, RATIO_PRECISION)?;
            weighted_sum = weighted_sum.checked_add(weighted_value)
                .ok_or(ErrorCode::ArithmeticError)?;
            weight_sum = weight_sum.checked_add(*weight)
                .ok_or(ErrorCode::ArithmeticError)?;
        }
        
        require!(weight_sum > 0, ErrorCode::DivisionByZero);
        Self::divide(weighted_sum, weight_sum, RATIO_PRECISION)
    }

    pub fn pow(base: u64, exponent: u32) -> Result<u64> {
        let base_fixed = Self::to_fixed(base)?;
        let mut result = U64F64::from_num(1);
        let mut current_base = base_fixed;
        let mut current_exp = exponent;

        // Binary exponentiation (square-and-multiply)
        while current_exp > 0 {
            // If current exponent bit is 1, multiply result by current base
            if current_exp & 1 == 1 {
                result = result * current_base;
            }
            // Square the base
            current_base = current_base * current_base;
            // Move to next bit
            current_exp >>= 1;
        }
        
        Self::from_fixed(result)
    }
}



