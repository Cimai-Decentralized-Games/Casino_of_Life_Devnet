use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::metrics::HealthMetricsCalculator;
use crate::state::{
    modes::OperationMode,
    agent::{Agent, AgentType},
    controller::{Controller, ControlParameters, ControlLimits},
};

#[derive(Accounts)]
pub struct UpdateController<'info> {
    #[account(mut)]
    pub controller: Account<'info, Controller>,
    
    #[account(
        mut,
        constraint = controller.is_valid_agent(&agent.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub agent: Account<'info, Agent>,
    
    #[account(
        constraint = authority.key() == controller.authority @ ErrorCode::InvalidAgentAuthority
    )]
    pub authority: Signer<'info>,
}

pub fn update_controller_parameters(
    ctx: Context<UpdateController>,
    params: ControlParameters,
) -> Result<()> {
    let controller = &mut ctx.accounts.controller;
    let agent = &ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;
    
    // Check operation mode and authority
    require!(
        controller.can_execute_action(current_time)?,
        ErrorCode::OperationNotAllowed
    );

    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedAgent
    );

    // Update parameters
    controller.control_parameters = params;
    controller.timing.update(current_time);

    Ok(())
}

pub fn update_controller_mode(
    ctx: Context<UpdateController>,
    new_mode: OperationMode,
) -> Result<()> {
    let controller = &mut ctx.accounts.controller;
    let agent = &ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Check agent authority
    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedAgent
    );

    // Use the actual transition_to method that exists
    controller.controller_state.current_mode = controller
        .controller_state
        .current_mode
        .transition_to(new_mode)?;

    // Check emergency conditions if needed
    if new_mode.is_emergency() {
        require!(
            controller.health_metrics.price_stability_score < controller.control_parameters.max_spread,
            ErrorCode::EmergencyConditionsNotMet
        );
    }

    // Update timing
    controller.timing.update(current_time);

    Ok(())
}

pub fn update_health_metrics(
    ctx: Context<UpdateController>,
    new_metrics: HealthMetricsCalculator,
) -> Result<()> {
    let controller = &mut ctx.accounts.controller;
    let agent = &ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Check agent authority
    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedAgent
    );

    // Calculate health metrics using the calculator's method
    let (stability_score, _) = new_metrics.calculate_health_metrics(
        controller.controller_state.last_price,
        controller.controller_state.target_price,
        0, // We don't have reserves in Controller
        0  // We don't have total_supply in Controller
    )?;

    // Update controller's health metrics
    controller.health_metrics.price_stability_score = stability_score;
    controller.timing.update(current_time);

    // Check emergency conditions
    if stability_score < controller.control_parameters.max_spread {
        controller.controller_state.current_mode = controller
            .controller_state
            .current_mode
            .transition_to(OperationMode::Emergency)?;
    }

    Ok(())
}

pub fn update_controller_limits(
    ctx: Context<UpdateController>,
    new_limits: ControlLimits,
) -> Result<()> {
    let controller = &mut ctx.accounts.controller;
    let agent = &ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;
    
    // Check operation mode and authority
    require!(
        controller.can_execute_action(current_time)?,
        ErrorCode::OperationNotAllowed
    );

    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedAgent
    );

    // Update timing
    controller.timing.update(current_time);

    Ok(())
}