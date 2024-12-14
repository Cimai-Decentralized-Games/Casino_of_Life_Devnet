use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;
use crate::state::{
    modes::OperationMode,
    controller::{ControllerConfig, ControlParameters, ControlLimits},
    agent::{AgentType, PIDParameters, AgentConfig, AgentActionType},
    treasury::TreasuryConfig,
    curve::{CurveConfig, CurveRates},
};
use crate::instructions::{
    initialize::{InitializeController, InitializeAgent, InitializeTreasury},
    controller::UpdateController,
    curve::{InitializeCurve, UpdateCurve},
    operations::{MintOperation, BurnOperation},
    agent::{AgentOperation, MarketAnalysis, EmergencyActionType},
};
use crate::metrics::HealthMetricsCalculator;
use crate::errors::ErrorCode;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod security;
pub mod operations;
pub mod math;
pub mod metrics;

use instructions::*;

declare_id!("ED1wFswBBfem6T3CnQBjz3pBcqJ2xCr1t1EC2j6tacW");

#[program]
pub mod freedumbs_controller_program {
    use super::*;
    // Initialization Instructions
    pub fn initialize_controller(
        ctx: Context<InitializeController>,
        bump: u8,
        config: ControllerConfig
    ) -> Result<()> {
        instructions::initialize::initialize_controller(ctx, bump, config)
    }

    pub fn initialize_agent(
        ctx: Context<InitializeAgent>,
        bump: u8,
        agent_type: AgentType,
        config: AgentConfig
    ) -> Result<()> {
        instructions::initialize::initialize_agent(ctx, bump, agent_type, config)
    }

    pub fn initialize_treasury(
        ctx: Context<InitializeTreasury>,
        bump: u8,
        config: TreasuryConfig
    ) -> Result<()> {
        instructions::initialize::initialize_treasury(ctx, bump, config)
    }

    // Curve Instructions
    pub fn initialize_curve(
        ctx: Context<InitializeCurve>, 
        config: CurveConfig,
    ) -> Result<()> {
        instructions::curve::initialize_curve(ctx, config)
    }

    pub fn update_curve_parameters(
        ctx: Context<UpdateCurve>, 
        new_config: CurveConfig,
    ) -> Result<()> {
        instructions::curve::update_curve_parameters(ctx, new_config)
    }

    pub fn update_curve_dynamics(
        ctx: Context<UpdateCurve>, 
        new_rates: CurveRates,
        market_volatility: u64,
        liquidity_depth: u64,
    ) -> Result<()> {
        instructions::curve::update_curve_dynamics(ctx, new_rates, market_volatility, liquidity_depth)
    }

    pub fn calculate_mint_amount(
        ctx: Context<UpdateCurve>, 
        input_amount: u64,
    ) -> Result<u64> {
        instructions::curve::calculate_mint_amount(ctx, input_amount)
    }

    pub fn calculate_burn_amount(
        ctx: Context<UpdateCurve>, 
        output_amount: u64,
    ) -> Result<u64> {
        instructions::curve::calculate_burn_amount(ctx, output_amount)
    }

    // Controller Instructions
    pub fn update_controller_parameters(
        ctx: Context<UpdateController>, 
        params: ControlParameters,
    ) -> Result<()> {
        instructions::controller::update_controller_parameters(ctx, params)
    }

    pub fn update_controller_mode(
        ctx: Context<UpdateController>, 
        new_mode: OperationMode,
    ) -> Result<()> {
        // Validate mode transition
        let current_mode = ctx.accounts.controller.controller_state.current_mode;
        require!(
            current_mode.can_transition_to(new_mode),
            ErrorCode::InvalidModeTransition
        );

        instructions::controller::update_controller_mode(ctx, new_mode)
    }

    pub fn update_controller_limits(
        ctx: Context<UpdateController>, 
        new_limits: ControlLimits,
    ) -> Result<()> {
        instructions::controller::update_controller_limits(ctx, new_limits)
    }

    pub fn update_health_metrics(
        ctx: Context<UpdateController>, 
        new_metrics: HealthMetricsCalculator,
    ) -> Result<()> {
        instructions::controller::update_health_metrics(ctx, new_metrics)
    }

    // Operation Instructions
    pub fn mint(
        ctx: Context<MintOperation>, 
        amount: u64,
    ) -> Result<()> {
        instructions::operations::execute_mint(ctx, amount)
    }

    pub fn burn(
        ctx: Context<BurnOperation>, 
        amount: u64,
    ) -> Result<()> {
        instructions::operations::execute_burn(ctx, amount)
    }

    pub fn distribute_fees(
        ctx: Context<MintOperation>,
    ) -> Result<()> {
        instructions::operations::distribute_fees(ctx)
    }

    pub fn rebalance_reserves(
        ctx: Context<MintOperation>,
    ) -> Result<()> {
        instructions::operations::rebalance_reserves(ctx)
    }

    // Agent Instructions
    pub fn update_pid_parameters(
        ctx: Context<AgentOperation>, 
        params: PIDParameters,
    ) -> Result<()> {
        instructions::agent::update_pid_parameters(ctx, params)
    }

    pub fn submit_market_analysis(
        ctx: Context<AgentOperation>, 
        analysis: MarketAnalysis,
    ) -> Result<()> {
        instructions::agent::submit_market_analysis(ctx, analysis)
    }

    pub fn emergency_intervention(
        ctx: Context<AgentOperation>, 
        action_type: EmergencyActionType,
    ) -> Result<()> {
        instructions::agent::emergency_intervention(ctx, action_type)
    }
}