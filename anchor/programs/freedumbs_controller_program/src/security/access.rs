use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{
    modes::OperationMode,
    agent::{Agent, AgentType, AgentActionType, HealthStatus},
    controller::{Controller, ControlActionType},
};

pub struct AccessControl;

impl AccessControl {
    pub fn verify_authority(
        agent: &Account<Agent>,
        authority: &Signer,
    ) -> Result<()> {
        require!(
            agent.authority == authority.key(),
            ErrorCode::UnauthorizedAccess
        );
        Ok(())
    }

    pub fn verify_agent_status(agent: &Account<Agent>) -> Result<()> {
        // Check active status
        require!(
            agent.active_status,
            ErrorCode::AgentNotActive
        );
        
        // Check operation mode
        require!(
            agent.operation_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );
        
        // Check health status
        require!(
            agent.health_status != HealthStatus::Critical,
            ErrorCode::AgentUnhealthy
        );
        
        Ok(())
    }

    pub fn verify_agent_permissions(
        agent: &Account<Agent>,
        required_type: AgentType,
        action_type: AgentActionType,
    ) -> Result<()> {
        // Check agent type
        require!(
            agent.agent_type == required_type,
            ErrorCode::UnauthorizedAgentType
        );

        // Check action permissions
        let can_act = agent.validate_action(action_type)?;
        require!(can_act, ErrorCode::UnauthorizedAgent);

        // Check timing
        require!(
            agent.timing.can_act(Clock::get()?.unix_timestamp as u64),
            ErrorCode::RateLimitExceeded
        );

        Ok(())
    }

    pub fn verify_controller_access(
        controller: &Account<Controller>,
        action_type: ControlActionType,
    ) -> Result<()> {
        let current_mode = controller.controller_state.current_mode;
        
        // Check operation mode allows actions
        require!(
            current_mode.can_execute_operations(),
            ErrorCode::OperationNotAllowed
        );

        // Check controller health
        require!(
            controller.health_metrics.price_stability_score >= controller.control_parameters.min_stability_threshold,
            ErrorCode::ControllerUnhealthy
        );

        Ok(())
    }

    pub fn verify_operation_mode(
        controller: &Account<Controller>,
        allowed_modes: &[OperationMode],
    ) -> Result<()> {
        let current_mode = controller.controller_state.current_mode;
        
        require!(
            allowed_modes.contains(&current_mode) && 
            current_mode.can_execute_operations(),
            ErrorCode::InvalidOperationMode
        );

        Ok(())
    }

    pub fn verify_full_access(
        agent: &Account<Agent>,
        controller: &Account<Controller>,
        authority: &Signer,
        required_type: AgentType,
        action_type: AgentActionType,
        allowed_modes: &[OperationMode],
    ) -> Result<()> {
        // Check all access requirements in sequence
        Self::verify_authority(agent, authority)?;
        Self::verify_agent_status(agent)?;
        Self::verify_agent_permissions(agent, required_type, action_type)?;
        Self::verify_operation_mode(controller, allowed_modes)?;
        
        Ok(())
    }
}