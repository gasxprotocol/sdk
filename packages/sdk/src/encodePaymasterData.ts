import { concatHex, encodePacked } from "viem";
import type { SignedApproval } from "./types.js";

/**
 * Assembles `paymasterAndData` to the EXACT layout `GasXPaymasterBase._decodeApproval` parses:
 *   [paymaster(20) | verificationGasLimit(16) | postOpGasLimit(16)]   (PAYMASTER_DATA_OFFSET = 52)
 *   [campaignId(32) | sender(20) | maxFeeWei(32) | validAfter(6) | validUntil(6) | eligibilityRef(32)]  (128 bytes)
 *   [approval signature (65)]
 * Total = 245 bytes. NOTE: `userOpHash` is NOT in the wire region — it is derived on-chain (and signed by the
 * approval); the off-chain producer must set `approval.userOpHash` to the EntryPoint binding hash before signing.
 */
export function encodePaymasterAndData(args: {
  paymaster: `0x${string}`;
  paymasterVerificationGasLimit: bigint;
  paymasterPostOpGasLimit: bigint;
  approval: SignedApproval;
  signature: `0x${string}`;
}): `0x${string}` {
  const a = args.approval;
  const offset = encodePacked(
    ["address", "uint128", "uint128"],
    [args.paymaster, args.paymasterVerificationGasLimit, args.paymasterPostOpGasLimit],
  );
  const signedRegion = encodePacked(
    ["bytes32", "address", "uint256", "uint48", "uint48", "bytes32"],
    [a.campaignId, a.sender, a.maxFeeWei, a.validAfter, a.validUntil, a.eligibilityRef],
  );
  return concatHex([offset, signedRegion, args.signature]);
}
