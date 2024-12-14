use anchor_lang::prelude::*;
use crate::errors::ErrorCode;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Debug)]
pub enum OperationMode {
    Normal,
    Defensive,
    Recovery,
    Emergency,
    Paused,
    Uninitialized,
}

impl Default for OperationMode {
    fn default() -> Self {
        OperationMode::Uninitialized
    }
}

impl OperationMode {
    pub fn can_execute_operations(&self) -> bool {
        matches!(self, 
            OperationMode::Normal | 
            OperationMode::Defensive | 
            OperationMode::Recovery
        )
    }

    pub fn is_emergency(&self) -> bool {
        matches!(self, OperationMode::Emergency)
    }

    pub fn is_paused(&self) -> bool {
        matches!(self, OperationMode::Paused)
    }

    pub fn transition_to(&self, new_mode: OperationMode) -> Result<OperationMode> {
        match (*self, new_mode) {
            // Can always transition to Emergency
            (_, OperationMode::Emergency) => Ok(OperationMode::Emergency),
            
            // Can't transition from Emergency except to Recovery
            (OperationMode::Emergency, mode) if mode != OperationMode::Recovery => {
                Err(ErrorCode::InvalidStateTransition.into())
            },

            // Can't transition from Paused except to Normal or Emergency
            (OperationMode::Paused, mode) if !matches!(mode, OperationMode::Normal | OperationMode::Emergency) => {
                Err(ErrorCode::InvalidStateTransition.into())
            },

            // Can't transition to Uninitialized
            (_, OperationMode::Uninitialized) => {
                Err(ErrorCode::InvalidStateTransition.into())
            },

            // All other transitions are valid
            (_, new_mode) => Ok(new_mode),
        }
    }

    pub fn requires_emergency_authority(&self) -> bool {
        matches!(self, 
            OperationMode::Emergency | 
            OperationMode::Recovery
        )
    }

    pub fn allows_trading(&self) -> bool {
        matches!(self, 
            OperationMode::Normal |
            OperationMode::Defensive
        )
    }

    pub fn can_transition_to(&self, new_mode: OperationMode) -> bool {
        match (*self, new_mode) {
            // Can always transition to Emergency
            (_, OperationMode::Emergency) => true,

            // Can't transition from Emergency except to Recovery
            (OperationMode::Emergency, mode) if mode != OperationMode::Recovery => false,

            // Can't transition from Paused except to Normal or Emergency
            (OperationMode::Paused, mode) if !matches!(mode, OperationMode::Normal | OperationMode::Emergency) => false,

            // Can't transition to Uninitialized
            (_, OperationMode::Uninitialized) => false,

            // All other transitions are valid
            _ => true,
        }
    }
}