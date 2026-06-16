/**
 * The EIP-712 SignedApproval (mirrors GasXPolicyLib.SignedApproval). `userOpHash` is the binding hash the
 * on-chain base derives (EntryPoint userOpHash over the signature-excluded paymasterAndData) — it is signed
 * but NOT carried in the wire pad (the 128-byte region omits it; see encodePaymasterData).
 */
export interface SignedApproval {
  campaignId: `0x${string}`;
  sender: `0x${string}`;
  userOpHash: `0x${string}`;
  maxFeeWei: bigint;
  validAfter: number;
  validUntil: number;
  eligibilityRef: `0x${string}`;
}
