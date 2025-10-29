use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Farm {
    pub owner: Pubkey,
    #[max_len(50)]
    pub name: String,

    pub farm_token_mint: Pubkey,

    // vaults
    pub payment_mint: Pubkey,
    pub farm_payment_vault: Pubkey,
    pub farm_revenue_vault: Pubkey,

    pub total_shares: u64,
    pub minted_shares: u64,
    pub price_per_share: u64,

    pub account_revenue_per_share: u128,

    pub bump: u8,
    pub signer_bump: u8,
}
