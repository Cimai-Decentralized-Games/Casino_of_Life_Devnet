use anchor_lang::prelude::*;
use crate::state::{
    modes::OperationMode,
    treasury::Treasury,
    curve::Curve,
    market::MarketState,
    agent::Agent,
    controller::Controller,
};
use crate::errors::ErrorCode;
use crate::math::{FixedPointCalculator, RatioCalculator, constants::*};

#[derive(Accounts)]
pub struct MintOperation<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub curve: Account<'info, Curve>,
    
    #[account(mut)]
    pub market_state: Account<'info, MarketState>,
    
    #[account(
        mut,
        constraint = treasury.is_valid_agent(&agent.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(
        mut,
        constraint = agent.is_valid_controller(&controller.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub controller: Account<'info, Controller>,
    
    #[account(
        constraint = authority.key() == agent.authority @ ErrorCode::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BurnOperation<'info> {
    #[account(mut)]
    pub treasury: Account<'info, Treasury>,
    
    #[account(mut)]
    pub curve: Account<'info, Curve>,
    
    #[account(mut)]
    pub market_state: Account<'info, MarketState>,
    
    #[account(
        mut,
        constraint = treasury.is_valid_agent(&agent.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(
        mut,
        constraint = agent.is_valid_controller(&controller.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub controller: Account<'info, Controller>,
    
    #[account(
        constraint = authority.key() == agent.authority @ ErrorCode::UnauthorizedAuthority
    )]
    pub authority: Signer<'info>,
}

pub fn execute_mint(
    ctx: Context<MintOperation>,
    amount: u64,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let curve = &mut ctx.accounts.curve;
    let market = &mut ctx.accounts.market_state;
    let agent = &ctx.accounts.agent;

    // Check operation modes
    require!(
        treasury.operation_mode.can_execute_operations() &&
        market.operation_mode.can_execute_operations() &&
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    // Check amount bounds
    require!(
        amount >= agent.action_bounds.min_amount &&
        amount <= agent.action_bounds.max_amount,
        ErrorCode::InvalidParameter
    );

    // Calculate mint amount using curve
    let mint_amount = FixedPointCalculator::calculate_mint_amount(
        amount,
        curve.rates.mint_multiplier,
        curve.slope,
        market.current_price,
        curve.target_price
    )?;

    // Update treasury reserves
    treasury.process_mint(mint_amount)?;

    // Update market metrics
    market.update_after_mint(mint_amount, amount)?;

    // Update timing
    treasury.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());
    curve.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());
    market.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());

    Ok(())
}

pub fn execute_burn(
    ctx: Context<BurnOperation>,
    amount: u64,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let curve = &mut ctx.accounts.curve;
    let market = &mut ctx.accounts.market_state;
    let agent = &ctx.accounts.agent;

    // Check operation modes
    require!(
        treasury.operation_mode.can_execute_operations() &&
        market.operation_mode.can_execute_operations() &&
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    // Check amount bounds
    require!(
        amount >= agent.action_bounds.min_amount &&
        amount <= agent.action_bounds.max_amount,
        ErrorCode::InvalidParameter
    );

    // Calculate burn amount using curve
    let burn_amount = FixedPointCalculator::calculate_burn_amount(
        amount,
        curve.rates.burn_multiplier,
        curve.slope,
        market.current_price,
        curve.target_price
    )?;

    // Update treasury reserves
    treasury.process_burn(burn_amount)?;

    // Update market metrics
    market.update_after_burn(burn_amount, amount)?;

    // Update timing
    treasury.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());
    curve.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());
    market.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());

    Ok(())
}

pub fn distribute_fees(
    ctx: Context<MintOperation>,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let agent = &mut ctx.accounts.agent;

    // Check operation modes
    require!(
        treasury.operation_mode.can_execute_operations() &&
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    // Validate distribution timing
    require!(
        treasury.timing.can_act(Clock::get()?.unix_timestamp.try_into().unwrap()),
        ErrorCode::CooldownNotMet
    );

    // Process fee distribution
    treasury.process_fee_distribution(agent)?;

    // Update timing
    treasury.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());

    Ok(())
}

pub fn rebalance_reserves(
    ctx: Context<MintOperation>,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let agent = &mut ctx.accounts.agent;
    let market = &ctx.accounts.market_state;

    // Check operation modes
    require!(
        treasury.operation_mode.can_execute_operations() &&
        market.operation_mode.can_execute_operations() &&
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    // Validate timing
    require!(
        treasury.timing.can_act(Clock::get()?.unix_timestamp.try_into().unwrap()),
        ErrorCode::CooldownNotMet
    );

    // Check if rebalance is needed
    require!(
        treasury.needs_rebalance()?,
        ErrorCode::RebalanceNotNeeded
    );

    // Calculate and execute rebalance
    treasury.execute_rebalance(market.current_price)?;

    // Update timing
    treasury.timing.update(Clock::get()?.unix_timestamp.try_into().unwrap());

    Ok(())
}