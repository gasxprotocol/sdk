import { encodeFunctionData } from "viem";

/**
 * @gasx settlement surface — the off-chain half of the B3 x402 value ceiling. A merchant publishes
 * x402 payment requirements whose `payTo` is the GasXSettlementRouter; the paying agent signs an
 * EIP-3009 `receiveWithAuthorization` to that router (see `signReceiveAuthorization`); the facilitator
 * encodes `settle(...)` here and submits it. The router enforces the sponsor's aggregate value ceiling
 * on-chain (strict `consumeValue` → revert blocks the settlement), pulls the funds, and forwards them.
 */

/** Minimal ABI for GasXSettlementRouter.settle (the only call a facilitator needs to encode). */
export const GASX_SETTLEMENT_ROUTER_ABI = [
  {
    type: "function",
    name: "settle",
    stateMutability: "nonpayable",
    inputs: [
      { name: "campaignId", type: "bytes32" },
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "merchant", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

export interface SettleArgs {
  /** the value campaign whose aggregate budget this draws down (its settler must be the router) */
  campaignId: `0x${string}`;
  /** the stablecoin (EIP-3009, e.g. USDC) */
  token: `0x${string}`;
  /** the paying agent (the EIP-3009 authorizer) */
  from: `0x${string}`;
  /** the real recipient the router forwards to */
  merchant: `0x${string}`;
  /** authorized amount in the token's native units */
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: `0x${string}`;
  /** the agent's EIP-3009 receiveWithAuthorization signature (to = the router) */
  signature: `0x${string}`;
}

/** Encode the GasXSettlementRouter.settle calldata a facilitator submits to settle one x402 payment. */
export function encodeSettle(args: SettleArgs): `0x${string}` {
  return encodeFunctionData({
    abi: GASX_SETTLEMENT_ROUTER_ABI,
    functionName: "settle",
    args: [
      args.campaignId,
      args.token,
      args.from,
      args.merchant,
      args.value,
      args.validAfter,
      args.validBefore,
      args.nonce,
      args.signature,
    ],
  });
}

/** x402 payment requirements (the merchant's HTTP-402 response body), per the x402 `exact` scheme. */
export interface X402PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  /** the address funds are authorized to — set to the GasX router so the ceiling is enforced */
  payTo: `0x${string}`;
  maxTimeoutSeconds: number;
  asset: `0x${string}`;
  extra?: Record<string, unknown>;
}

/**
 * Build x402 payment requirements that route settlement THROUGH the GasX router (`payTo = router`), so
 * the sponsor's aggregate value ceiling is enforced on-chain. This is the integration a merchant ships:
 * a payment routed straight to the merchant (payTo = merchant) would bypass the ceiling, by design of
 * EIP-3009 — which is exactly why `payTo` must be the router.
 */
export function buildX402PaymentRequirements(args: {
  router: `0x${string}`;
  token: `0x${string}`;
  /** atomic units (native token decimals) */
  maxAmountRequired: bigint;
  network: string;
  resource: string;
  description?: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
  /** the token's EIP-712 domain hints (name/version), echoed for the agent's authorization */
  tokenName?: string;
  tokenVersion?: string;
}): X402PaymentRequirements {
  return {
    scheme: "exact",
    network: args.network,
    maxAmountRequired: args.maxAmountRequired.toString(),
    resource: args.resource,
    description: args.description ?? "",
    mimeType: args.mimeType ?? "application/json",
    payTo: args.router,
    maxTimeoutSeconds: args.maxTimeoutSeconds ?? 60,
    asset: args.token,
    extra:
      args.tokenName !== undefined
        ? { name: args.tokenName, version: args.tokenVersion ?? "2" }
        : undefined,
  };
}
