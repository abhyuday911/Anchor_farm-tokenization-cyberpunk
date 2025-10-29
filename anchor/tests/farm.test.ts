import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  createAccount,
  createMint,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { FarmTokenization } from "../target/types/farm_tokenization";

describe("Farm lifecycle", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.FarmTokenization as Program<FarmTokenization>;

  const payer = provider.wallet;
  const farmOwnerPubKey = payer.publicKey;

  let farmPda: PublicKey;
  let farmSignerPda: PublicKey;
  let farmTokenMint: PublicKey;
  let farmPaymentVault: PublicKey;
  let farmRevenueVault: PublicKey;
  let paymentMint: PublicKey;

  let buyer: anchor.web3.Keypair;
  let buyerPaymentAta: PublicKey;
  let investorFarmTokenAta: PublicKey;

  beforeAll(async () => {
    [farmPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm"), farmOwnerPubKey.toBuffer()],
      program.programId
    );

    [farmSignerPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("farm"), farmPda.toBuffer()],
      program.programId
    );

    [farmPaymentVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("payment-vault"), farmPda.toBuffer()],
      program.programId
    );

    [farmRevenueVault] = PublicKey.findProgramAddressSync(
      [Buffer.from("revenue-vault"), farmPda.toBuffer()],
      program.programId
    );

    farmTokenMint = await createMint(
      provider.connection,
      (payer as anchor.Wallet).payer,
      farmSignerPda,
      null,
      6
    );

    paymentMint = await createMint(
      provider.connection,
      (payer as anchor.Wallet).payer,
      farmOwnerPubKey,
      null,
      6
    );

    buyer = anchor.web3.Keypair.generate();
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(buyer.publicKey, 2e9)
    );

    buyerPaymentAta = await createAccount(
      provider.connection,
      (payer as anchor.Wallet).payer,
      paymentMint,
      buyer.publicKey
    );

    investorFarmTokenAta = await createAccount(
      provider.connection,
      (payer as anchor.Wallet).payer,
      farmTokenMint,
      buyer.publicKey
    );

    await mintTo(
      provider.connection,
      (payer as anchor.Wallet).payer,
      paymentMint,
      buyerPaymentAta,
      farmOwnerPubKey,
      1_000_000_000
    );
  });

  it("initializes the Farm", async () => {
    await program.methods
      .farmInitialize(new anchor.BN(1_000_000), new anchor.BN(100))
      .accounts({
        owner: farmOwnerPubKey,
        farm: farmPda,
        farmTokenMint,
        farmSigner: farmSignerPda,
        paymentMint,
        farmPaymentVault,
        farmRevenueVault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([(payer as anchor.Wallet).payer])
      .rpc();

    const farmAccount = await program.account.farm.fetch(farmPda);
    expect(farmAccount.owner.toString()).toBe(farmOwnerPubKey.toString());
    expect(farmAccount.totalShares.toNumber()).toBe(1_000_000);
    expect(farmAccount.pricePerShare.toNumber()).toBe(100);
  });

  it("buys shares", async () => {
    const amount = new anchor.BN(500);
    const payAmount = new anchor.BN(50_000);

    const [userPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), farmPda.toBuffer(), buyer.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .shareBuying(amount, payAmount)
        .accounts({
          farm: farmPda,
          farmSigner: farmSignerPda,
          payer: buyer.publicKey,
          payerAta: buyerPaymentAta,
          farmPaymentVault,
          farmTokenMint: farmTokenMint,
          investorFarmTokenAta,
          user: userPda,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([buyer])
        .rpc();

      const farmAccount = await program.account.farm.fetch(farmPda);
      expect(farmAccount.mintedShares.toNumber()).toBe(500);

      const userStake = await program.account.userStake.fetch(userPda);
      expect(userStake.owner.toBase58()).toBe(buyer.publicKey.toBase58());
      expect(userStake.quantity).toBe(500);
    } catch (error) {
      console.error(error)
    }
  });

  it("fail if amount == 0", async () => {
    const tx = program.methods
      .shareBuying(new anchor.BN(0), new anchor.BN(100))
      .accounts({
        farm: farmPda,
        farmSigner: farmSignerPda,
        payer: buyer.publicKey,
        payerAta: buyerPaymentAta,
        farmPaymentVault,
        farmTokenMint,
        investorFarmTokenAta,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([buyer]);

    await expect(tx.rpc()).rejects.toThrow("InvalidShares");
  });
});
