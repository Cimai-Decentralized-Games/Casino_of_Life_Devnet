use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum ReserveHealth {
    Healthy,
    Warning,
    Critical,
    Emergency
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum AdjustmentDirection {
    Increase,
    Decrease,
    NoChange
}