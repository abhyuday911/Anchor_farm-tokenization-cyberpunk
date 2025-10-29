#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
declare_id!("GwvQ53QTu1xz3XXYfG5m5jEqwhMBvVBudPS8TUuFYnhT");

pub mod instructions;
pub use instructions::*;

pub mod states;
pub use states::*;

pub mod error;

#[program]
pub mod farm_tokenization {
    use super::*;
    pub fn farm_initialize(
        ctx: Context<InitializeFarm>,
        total_shares: u64,
        price_per_share: u64,
    ) -> Result<()> {
        instructions::initialize_farm(ctx, total_shares, price_per_share)
    }
    pub fn share_buying(ctx: Context<BuyShares>, amount: u64, pay_amount: u64) -> Result<()> {
        instructions::buy_shares(ctx, amount, pay_amount)
    }
}
