import type { TypedDataDomain } from "viem";

/**
 * EIP-712 types for the GasX SignedApproval. MUST stay byte-identical to GasXPolicyLib.APPROVAL_TYPEHASH
 * and the field order in GasXPolicyLib.SignedApproval (any drift breaks on-chain recovery).
 */
export const SIGNED_APPROVAL_TYPES = {
  SignedApproval: [
    { name: "campaignId", type: "bytes32" },
    { name: "sender", type: "address" },
    { name: "userOpHash", type: "bytes32" },
    { name: "maxFeeWei", type: "uint256" },
    { name: "validAfter", type: "uint48" },
    { name: "validUntil", type: "uint48" },
    { name: "eligibilityRef", type: "bytes32" },
  ],
} as const;

/** The canonical EIP-712 type string; its keccak256 is GasXPolicyLib.APPROVAL_TYPEHASH. */
export const SIGNED_APPROVAL_TYPE_STRING =
  "SignedApproval(bytes32 campaignId,address sender,bytes32 userOpHash,uint256 maxFeeWei,uint48 validAfter,uint48 validUntil,bytes32 eligibilityRef)";

/** Frozen on-chain APPROVAL_TYPEHASH (cast keccak of the type string) — the cross-side anchor. */
export const APPROVAL_TYPEHASH =
  "0xd8333865522aae9fe4fa05de138ace76fce5775e9b4f48ec905aaa5c6c059eba" as const;

/** MUST equal EIP712(name, version) in GasXPaymasterBase: name "GasX", version "1". */
export function gasxDomain(args: {
  chainId: number;
  verifyingContract: `0x${string}`;
}): TypedDataDomain {
  return { name: "GasX", version: "1", chainId: args.chainId, verifyingContract: args.verifyingContract };
}
