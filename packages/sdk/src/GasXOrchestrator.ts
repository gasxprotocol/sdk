import { encodePaymasterAndData } from "./encodePaymasterData.js";
import type { SignedApproval } from "./types.js";

export interface GasXContext {
  campaignId: `0x${string}`;
  strategyHint?: `0x${string}`;
}

export interface ResolvedPaymaster {
  paymaster: `0x${string}`;
  verificationGasLimit: bigint;
  postOpGasLimit: bigint;
}

/**
 * ERC-7677 service (spec §6.1). `pm_getPaymasterData` assembles `paymasterAndData` from a SignedApproval
 * produced by `GasXOracleSigner` (after eligibility + budget). The byte layout MUST match
 * `GasXPaymasterBase._decodeApproval` (see encodePaymasterData).
 *
 * Binding note: `produceApproval` is responsible for setting `approval.userOpHash` to the EntryPoint binding
 * hash. Because the orchestrator runs server-side with RPC, the authoritative way to obtain it is an
 * `eth_call` to `EntryPoint.getUserOpHash(op)` over the op whose `paymasterAndData` is the 128-byte
 * signature-excluded region — identical to the on-chain `_bindingUserOpHash` derivation, so there is no
 * pure-TS reproduction to drift (audit gasx-fwd-2/5).
 */
export class GasXOrchestrator {
  constructor(
    private readonly resolvePaymaster: (chainId: number, ctx: GasXContext) => Promise<ResolvedPaymaster>,
    private readonly produceApproval: (
      chainId: number,
      ctx: GasXContext,
    ) => Promise<{ approval: SignedApproval; signature: `0x${string}` }>,
  ) {}

  async pm_getPaymasterData(chainId: number, ctx: GasXContext): Promise<{ paymasterAndData: `0x${string}` }> {
    const p = await this.resolvePaymaster(chainId, ctx);
    const { approval, signature } = await this.produceApproval(chainId, ctx);
    return {
      paymasterAndData: encodePaymasterAndData({
        paymaster: p.paymaster,
        paymasterVerificationGasLimit: p.verificationGasLimit,
        paymasterPostOpGasLimit: p.postOpGasLimit,
        approval,
        signature,
      }),
    };
  }

  /**
   * ERC-7677 gas-estimation stub: SAME-length `paymasterAndData` as the real op, with a fixed dummy approval
   * + a 65-byte NON-ZERO dummy signature (audit gasx-fwd-4). A non-zero sig makes ECDSA recover run the full
   * cost so estimation tracks real validation; max validity window so a simulating bundler clears the time
   * checks. Submitting it on-chain is expected to fail (UnauthorizedSigner) — it is never submitted.
   */
  async pm_getPaymasterStubData(chainId: number, ctx: GasXContext): Promise<{ paymasterAndData: `0x${string}` }> {
    const p = await this.resolvePaymaster(chainId, ctx);
    const dummySignature = ("0x" + "01".repeat(65)) as `0x${string}`;
    const dummyApproval: SignedApproval = {
      campaignId: ctx.campaignId,
      sender: "0x000000000000000000000000000000000000dEaD",
      userOpHash: ("0x" + "00".repeat(32)) as `0x${string}`,
      maxFeeWei: (2n ** 256n - 1n),
      validAfter: 0,
      validUntil: 281_474_976_710_655, // type(uint48).max
      eligibilityRef: ("0x" + "00".repeat(32)) as `0x${string}`,
    };
    return {
      paymasterAndData: encodePaymasterAndData({
        paymaster: p.paymaster,
        paymasterVerificationGasLimit: p.verificationGasLimit,
        paymasterPostOpGasLimit: p.postOpGasLimit,
        approval: dummyApproval,
        signature: dummySignature,
      }),
    };
  }
}
