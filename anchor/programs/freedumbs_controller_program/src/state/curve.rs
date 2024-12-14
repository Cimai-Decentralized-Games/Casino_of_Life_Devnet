use anchor_lang::prelude::*;
use crate::math::{FixedPointCalculator, RatioCalculator, constants::*};
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CurveRates {
    pub mint_multiplier: u64,
    pub burn_multiplier: u64,
    pub slippage_multiplier: u64,
    pub fee_multiplier: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CurveConfig {
    pub min_price: u64,
    pub max_price: u64,
    pub target_price: u64,
    pub reserve_ratio: u64,
    pub slope: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct TimeTracking {
    pub last_update: u64,
    pub last_action: u64,
    pub cooldown_period: u64,
}

#[account]
pub struct Curve {
    // Price Management
    pub initial_price: u64,
    pub current_price: u64,
    pub min_price: u64,
    pub max_price: u64,
    
    // Curve Parameters
    pub reserve_ratio: u64,      
    pub min_reserve_ratio: u64,
    pub slope: u64,              
    pub k: u64,                  
    pub x0: u64,                 
    
    // Supply and Reserves
    pub supply: u64,             
    pub current_supply: u64,     
    pub reserves: u64,           
    
    // Rate Configuration
    pub rates: CurveRates,
    pub fee_percentage: u64,     
    
    // Authority and Timing
    pub authority: Pubkey,
    pub timing: TimeTracking,
    pub target_price: u64,
}

impl Curve {
    pub const SPACE: usize = 8 +    // discriminator
        8 +                         // initial_price
        8 +                         // current_price
        8 +                         // min_price
        8 +                         // max_price
        8 +                         // reserve_ratio
        8 +                         // min_reserve_ratio
        8 +                         // slope
        8 +                         // k
        8 +                         // x0
        8 +                         // supply
        8 +                         // current_supply
        8 +                         // reserves
        32 +                        // CurveRates (4 * i64)
        8 +                         // fee_percentage
        32 +                        // authority
        8 +                         // target_price
        8;                          // last_update

    pub fn validate_price(&self, price: u64) -> Result<()> {
        require!(
            price >= self.min_price && price <= self.max_price,
            ErrorCode::InvalidPrice
        );
        Ok(())
    }

    pub fn calculate_mint_amount(&self, payment_amount: u64) -> Result<u64> {
        let price = self.current_price;
        require!(price > 0, ErrorCode::InvalidPrice);

        let mint_amount = FixedPointCalculator::divide(
            payment_amount as u64,
            price as u64,
            PRICE_PRECISION
        )?;

        Ok(mint_amount as u64)
    }

    pub fn calculate_burn_amount(&self, token_amount: u64) -> Result<u64> {
        let price = self.current_price;
        require!(price > 0, ErrorCode::InvalidPrice);

        let burn_amount = FixedPointCalculator::multiply(
            token_amount as u64,
            price as u64,
            PRICE_PRECISION
        )?;

        Ok(burn_amount as u64)
    }

    pub fn update_price(&mut self, new_supply: u64) -> Result<()> {
        // Calculate new price based on bonding curve formula
        // P = k * (x - x0)^slope
        let supply_delta = new_supply.checked_sub(self.x0)
            .ok_or(ErrorCode::ArithmeticError)?;

        let powered_delta = FixedPointCalculator::pow(supply_delta, self.slope as u32)?;
        let new_price = FixedPointCalculator::multiply(
            self.k,
            powered_delta,
            PRICE_PRECISION
        )?;

        self.current_price = new_price;
        self.validate_price(self.current_price)?;

        Ok(())
    }

    pub fn update_reserves(&mut self, amount: i64) -> Result<()> {
        if amount >= 0 {
            self.reserves = self.reserves
                .checked_add(amount as u64)
                .ok_or(ErrorCode::ArithmeticError)?;
        } else {
            self.reserves = self.reserves
                .checked_sub(amount.unsigned_abs())
                .ok_or(ErrorCode::ArithmeticError)?;
        }

        // Update reserve ratio using proper precision
        let new_ratio = RatioCalculator::calculate_reserve_ratio(
            self.reserves,
            self.current_supply
        )?;

        require!(
            new_ratio >= self.min_reserve_ratio,
            ErrorCode::InsufficientReserves
        );

        Ok(())
    }

    pub fn apply_slippage(&self, amount: u64, is_mint: bool) -> Result<u64> {
        let slippage = if is_mint {
            FixedPointCalculator::multiply(
                amount as u64,
                self.rates.slippage_multiplier as u64,
                FEE_PRECISION
            )?
        } else {
            FixedPointCalculator::multiply(
                amount as u64,
                self.rates.slippage_multiplier as u64,
                FEE_PRECISION
            )?
        };

        Ok(slippage as u64)
    }

    pub fn calculate_fee(&self, amount: u64) -> Result<u64> {
        let fee = FixedPointCalculator::multiply(
            amount as u64,
            self.rates.fee_multiplier as u64,
            FEE_PRECISION
        )?;

        Ok(fee as u64)
    }
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

impl Default for TimeTracking {
    fn default() -> Self {
        Self {
            last_update: 0,
            last_action: 0,
            cooldown_period: 0,
        }
    }
}

impl Default for Curve {
    fn default() -> Self {
        Self {
            initial_price: 0,
            current_price: 0,
            min_price: 0,
            max_price: 0,
            reserve_ratio: 500_000,   
            min_reserve_ratio: 0,
            slope: 0,
            k: 0,
            x0: 0,
            supply: 0,
            current_supply: 0,
            reserves: 0,
            rates: CurveRates::default(),
            fee_percentage: 30,      
            authority: Pubkey::default(),
            timing: TimeTracking::default(),
            target_price: 0,
        }
    }
}