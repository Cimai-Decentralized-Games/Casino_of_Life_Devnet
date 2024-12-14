use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{
    modes::OperationMode,
    agent::{Agent, AgentType, PIDParameters, ActionBounds},
    controller::Controller,
    market::MarketState,
    treasury::{Treasury, HealthStatus},
};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub enum EmergencyActionType {
    PauseMinting,
    AdjustBounds,
    ForceRebalance,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MarketAnalysis {
    pub trend: u64,
    pub volatility: u64,
    pub liquidity: u64,
}

#[derive(Accounts)]
pub struct AgentOperation<'info> {
    #[account(mut)]
    pub agent: Account<'info, Agent>,
    
    #[account(
        mut,
        constraint = agent.is_valid_controller(&controller.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub controller: Account<'info, Controller>,
    
    #[account(mut)]
    pub market_state: Account<'info, MarketState>,
    
    #[account(
        mut,
        constraint = controller.is_valid_treasury(&treasury.key()) @ ErrorCode::InvalidAccountRelationship
    )]
    pub treasury: Account<'info, Treasury>,
    
    #[account(
        constraint = authority.key() == agent.authority @ ErrorCode::InvalidAgentAuthority
    )]
    pub authority: Signer<'info>,
}

pub fn update_pid_parameters(
    ctx: Context<AgentOperation>,
    params: PIDParameters,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Check protocol authority and operation mode
    require!(
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    require!(
        agent.agent_type != AgentType::Observer,
        ErrorCode::UnauthorizedAgentType
    );

    // Update parameters
    agent.pid_parameters = params;
    agent.timing.update(current_time);

    Ok(())
}

pub fn adjust_action_bounds(
    ctx: Context<AgentOperation>,
    new_bounds: ActionBounds,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Check protocol authority and operation mode
    require!(
        agent.operation_mode.can_execute_operations(),
        ErrorCode::OperationNotAllowed
    );

    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedAgentType
    );

    // Update bounds
    agent.action_bounds = new_bounds;
    agent.timing.update(current_time);

    Ok(())
}

pub fn submit_market_analysis(
    ctx: Context<AgentOperation>,
    analysis: MarketAnalysis,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let market = &mut ctx.accounts.market_state;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Update market metrics with the analysis components
    market.update_metrics(
        analysis.volatility,
        analysis.liquidity,
        current_time
    )?;

    // Update agent timing
    agent.timing.update(current_time);

    Ok(())
}

pub fn emergency_intervention(
    ctx: Context<AgentOperation>,
    action_type: EmergencyActionType,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let controller = &mut ctx.accounts.controller;
    let treasury = &mut ctx.accounts.treasury;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Check emergency authority and conditions
    require!(
        agent.agent_type == AgentType::Primary,
        ErrorCode::UnauthorizedEmergencyAction
    );

    require!(
        treasury.health_status == HealthStatus::Emergency,
        ErrorCode::EmergencyConditionsNotMet
    );

    // Execute emergency action
    match action_type {
        EmergencyActionType::PauseMinting => {
            controller.controller_state.current_mode = controller
                .controller_state
                .current_mode
                .transition_to(OperationMode::Emergency)?;
            treasury.operation_mode = treasury
                .operation_mode
                .transition_to(OperationMode::Emergency)?;
        },
        EmergencyActionType::AdjustBounds => {
            // Update bounds to emergency values
            agent.action_bounds = ActionBounds {
                min_amount: 0,
                max_amount: 0,
                max_price_impact: 0,
                min_price_impact: 0,
                time_bounds: agent.action_bounds.time_bounds,
            };
        },
        EmergencyActionType::ForceRebalance => {
            // Update reserves to emergency state
            treasury.update_reserves(0, false)?;
        },
    }

    // Update timing
    agent.timing.update(current_time);

    Ok(())
}