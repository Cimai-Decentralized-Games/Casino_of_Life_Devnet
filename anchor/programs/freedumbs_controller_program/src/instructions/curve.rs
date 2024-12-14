use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::math::{FixedPointCalculator, constants::*};
use crate::state::{
    modes::OperationMode,
    curve::{Curve, CurveConfig, CurveRates},
    market::MarketState,
};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeCurve<'info> {
    #[account(
        init,
        seeds = [b"curve"],
        bump,
        payer = authority,
        space = Curve::SPACE
    )]
    pub curve: Account<'info, Curve>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateCurve<'info> {
    #[account(
        mut,
        seeds = [b"curve"],
        bump,
        has_one = authority
    )]
    pub curve: Account<'info, Curve>,
    
    #[account(
        mut,
        constraint = market_state.operation_mode.can_execute_operations() @ ErrorCode::OperationNotAllowed
    )]
    pub market_state: Account<'info, MarketState>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdjustCurve<'info> {
    #[account(
        mut,
        seeds = [b"curve"],
        bump,
        has_one = authority
    )]
    pub curve: Account<'info, Curve>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResetCurve<'info> {
    #[account(
        mut,
        seeds = [b"curve"],
        bump,
        has_one = authority
    )]
    pub curve: Account<'info, Curve>,
    pub authority: Signer<'info>,
}

pub fn initialize_curve(
    ctx: Context<InitializeCurve>,
    config: CurveConfig,
) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();

    // Validate price bounds
    require!(
        config.min_price < config.max_price && 
        config.target_price >= config.min_price && 
        config.target_price <= config.max_price,
        ErrorCode::InvalidParameter
    );

    // Initialize curve state
    curve.authority = ctx.accounts.authority.key();
    curve.initial_price = config.target_price;
    curve.current_price = config.target_price;
    curve.min_price = config.min_price;
    curve.max_price = config.max_price;
    curve.target_price = config.target_price;
    curve.reserve_ratio = config.reserve_ratio;
    curve.slope = config.slope;
    
    // Initialize rates
    curve.rates = CurveRates {
        mint_multiplier: INITIAL_MINT_MULTIPLIER,
        burn_multiplier: INITIAL_BURN_MULTIPLIER,
        slippage_multiplier: INITIAL_SLIPPAGE_MULTIPLIER,
        fee_multiplier: INITIAL_FEE_MULTIPLIER,
    };

    curve.timing.update(current_time);
    
    Ok(())
}

pub fn update_curve_parameters(
    ctx: Context<UpdateCurve>,
    new_config: CurveConfig,
) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();

    // Validate price bounds
    require!(
        new_config.min_price < new_config.max_price && 
        new_config.target_price >= new_config.min_price && 
        new_config.target_price <= new_config.max_price,
        ErrorCode::InvalidParameter
    );

    // Update parameters
    curve.min_price = new_config.min_price;
    curve.max_price = new_config.max_price;
    curve.target_price = new_config.target_price;
    curve.reserve_ratio = new_config.reserve_ratio;
    curve.slope = new_config.slope;

    curve.timing.update(current_time);

    Ok(())
}

pub fn update_curve_dynamics(
    ctx: Context<UpdateCurve>,
    new_rates: CurveRates,
    market_volatility: u64,
    liquidity_depth: u64,
) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let market = &mut ctx.accounts.market_state;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();

    // Validate market metrics
    require!(
        market_volatility > 0 && liquidity_depth > 0,
        ErrorCode::InvalidParameter
    );

    // Update market metrics
    market.update_metrics(
        market_volatility,
        liquidity_depth,
        current_time
    )?;

    // Update curve rates
    curve.rates = new_rates;
    curve.timing.update(current_time);

    Ok(())
}

pub fn calculate_mint_amount(
    ctx: Context<UpdateCurve>,
    input_amount: u64,
) -> Result<u64> {
    let curve = &ctx.accounts.curve;
    curve.calculate_mint_amount(input_amount)
}

pub fn calculate_burn_amount(
    ctx: Context<UpdateCurve>,
    output_amount: u64,
) -> Result<u64> {
    let curve = &ctx.accounts.curve;
    curve.calculate_burn_amount(output_amount)
}

pub fn update_curve(ctx: Context<UpdateCurve>) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();
    
    // Update timing
    curve.timing.update(current_time);
    
    Ok(())
}

pub fn adjust_curve(ctx: Context<AdjustCurve>) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();
    
    // Update timing
    curve.timing.update(current_time);
    
    Ok(())
}

pub fn reset_curve(ctx: Context<ResetCurve>) -> Result<()> {
    let curve = &mut ctx.accounts.curve;
    let current_time = Clock::get()?.unix_timestamp.try_into().unwrap();
    
    // Update timing
    curve.timing.update(current_time);
    
    Ok(())
}