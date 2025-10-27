use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserStake {
    is_initialized: bool,
    owner: Pubkey,
    farm: Pubkey,
    quantity: u32,
    pay_amount: u64,
    debt_claimed: u128,
    bump: u8,
}
