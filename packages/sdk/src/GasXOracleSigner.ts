import type { Account, TypedDataDomain } from "viem";
import { SIGNED_APPROVAL_TYPES } from "./domain.js";
import type { SignedApproval } from "./types.js";

export type { SignedApproval };

/**
 * Off-chain half of the GasX policy bridge: signs the EIP-712 SignedApproval that the on-chain
 * GasXPaymasterBase verifies. The `userOpHash` field is the binding hash computed by the orchestrator
 * (the EntryPoint userOpHash over the signature-excluded paymasterAndData); this class only signs.
 */
export class GasXOracleSigner {
  constructor(private readonly account: Account) {}

  async sign(domain: TypedDataDomain, approval: SignedApproval): Promise<`0x${string}`> {
    if (!this.account.signTypedData) throw new Error("account cannot signTypedData");
    return this.account.signTypedData({
      domain,
      types: SIGNED_APPROVAL_TYPES,
      primaryType: "SignedApproval",
      message: approval,
    });
  }
}
