#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
declare_id!("GwvQ53QTu1xz3XXYfG5m5jEqwhMBvVBudPS8TUuFYnhT");

pub mod instructions;
pub use instructions::*;

pub mod states;
pub use states::*;

#[program]
pub mod farm_tokenization {
    use super::*;
    pub fn farm_initialize(ctx: Context<InitializeFarm>, total_shares: u64) -> Result<()> {
        instructions::initialize_farm(ctx, total_shares)
    }
}
