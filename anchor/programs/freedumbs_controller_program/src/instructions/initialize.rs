use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{
    modes::OperationMode,
    controller::{
        Controller, 
        ControllerConfig, 
        ControllerType,
        ControllerState,
        ControlParameters,
    },
    agent::{
        Agent, 
        AgentConfig, 
        AgentType,
    },
    treasury::{
        Treasury, 
        TreasuryConfig, 
        FeeConfig, 
        ReserveMetrics, 
        DistributionMetrics,
        HealthStatus,
    },
};

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeController<'info> {
    #[account(
        init,
        seeds = [b"controller"],
        bump,
        payer = authority,
        space = Controller::SPACE
    )]
    pub controller: Account<'info, Controller>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeAgent<'info> {
    #[account(
        init,
        seeds = [b"agent"],
        bump,
        payer = authority,
        space = Agent::SPACE
    )]
    pub agent: Account<'info, Agent>,

    #[account(mut)]
    pub controller: Account<'info, Controller>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bump: u8)]
pub struct InitializeTreasury<'info> {
    #[account(
        init,
        seeds = [b"treasury"],
        bump,
        payer = authority,
        space = Treasury::SPACE
    )]
    pub treasury: Account<'info, Treasury>,

    #[account(mut)]
    pub agent: Account<'info, Agent>,

    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn initialize_controller(
    ctx: Context<InitializeController>,
    bump: u8,
    config: ControllerConfig,
) -> Result<()> {
    let controller = &mut ctx.accounts.controller;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Initialize controller
    controller.authority = ctx.accounts.authority.key();
    controller.treasury = Pubkey::default();
    controller.controller_type = ControllerType::MainNet;
    controller.bump = bump;
    
    controller.controller_state = ControllerState {
        current_mode: OperationMode::Normal,
        target_price: 0,
        price_band_upper: 0,
        price_band_lower: 0,
        last_price: 0,
        last_update: current_time,
        market_volatility: 0,
        market_direction: 0,
        confidence_level: 0,
        mint_signal: 0,
        burn_signal: 0,
        curve_adjustment_signal: 0,
    };
    
    controller.control_parameters = ControlParameters::default();
    controller.max_transaction_amount = config.max_leverage;
    controller.fee_basis_points = 0;
    controller.initialized = true;

    Ok(())
}

pub fn initialize_agent(
    ctx: Context<InitializeAgent>,
    bump: u8,
    agent_type: AgentType,
    config: AgentConfig,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Initialize agent
    agent.authority = ctx.accounts.authority.key();
    agent.controller = ctx.accounts.controller.key();
    agent.agent_type = agent_type;
    agent.bump = bump;

    agent.active_status = true;
    agent.operation_mode = OperationMode::Normal;
    agent.health_status = crate::state::agent::HealthStatus::Healthy;
    agent.timing.cooldown_period = config.cooldown_period;

    Ok(())
}

pub fn initialize_treasury(
    ctx: Context<InitializeTreasury>,
    bump: u8,
    config: TreasuryConfig,
) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Initialize treasury
    treasury.authority = ctx.accounts.authority.key();
    treasury.agent = ctx.accounts.agent.key();
    treasury.bump = bump;
    
    treasury.treasury_config = config;
    treasury.fee_config = FeeConfig {
        protocol_fee_rate: 0,
        agent_fee_rate: 0,
        protocol_share: 0,
        agent_share: 0,
    };
    treasury.reserve_metrics = ReserveMetrics {
        total_reserves: 0,
        current_reserves: 0,
        minimum_reserves: 0,
        target_reserves: 0,
        reserve_ratio: 0,
        target_reserve_ratio: 0,
    };
    treasury.distribution_metrics = DistributionMetrics {
        accumulated_fees: 0,
        total_distributed_fees: 0,
        distribution_count: 0,
        last_distribution: 0,
        total_volume: 0,
    };
    treasury.health_status = HealthStatus::Healthy;
    treasury.operation_mode = OperationMode::Normal;
    treasury.timing.cooldown_period = config.distribution_frequency;

    Ok(())
}