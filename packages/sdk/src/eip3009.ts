import type { Account, TypedDataDomain } from "viem";

/**
 * EIP-3009 `receiveWithAuthorization` — the agent's authorization to pull a stablecoin payment. GasX
 * relies on the `receiveWithAuthorization` variant (not `transferWithAuthorization`) because the token
 * enforces `to == msg.sender`, so only the contract named as `to` can settle it. Set `to` to the
 * GasXSettlementRouter and the router is the sole, front-run-safe settlement path under which the
 * aggregate value ceiling is enforced on-chain.
 */
export const RECEIVE_WITH_AUTHORIZATION_TYPES = {
  ReceiveWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export interface ReceiveAuthorization {
  /** the paying agent (the authorizer / signer) */
  from: `0x${string}`;
  /** MUST be the GasXSettlementRouter — the choke-point that enforces the aggregate ceiling */
  to: `0x${string}`;
  /** amount in the token's native units (e.g. USDC 6dp) */
  value: bigint;
  validAfter: bigint;
  validBefore: bigint;
  /** single-use, token-tracked authorization nonce */
  nonce: `0x${string}`;
}

/**
 * The stablecoin's own EIP-712 domain (NOT the GasX domain). For Circle USDC, `name` is "USD Coin" and
 * `version` is "2"; read them from the token if unsure (e.g. `name()` + `version()` or `eip712Domain()`).
 */
export function tokenDomain(args: {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: `0x${string}`;
}): TypedDataDomain {
  return { name: args.name, version: args.version, chainId: args.chainId, verifyingContract: args.verifyingContract };
}

/**
 * Sign an EIP-3009 `receiveWithAuthorization` as the paying agent. `domain` is the STABLECOIN's EIP-712
 * domain; `auth.to` MUST be the settlement router. Returns the 65-byte signature the router forwards to
 * the token. Throws if `to` is unset, to prevent accidentally authorizing a non-choke-point recipient.
 */
export async function signReceiveAuthorization(
  account: Account,
  domain: TypedDataDomain,
  auth: ReceiveAuthorization
): Promise<`0x${string}`> {
  if (!auth.to || auth.to === "0x0000000000000000000000000000000000000000") {
    throw new Error("receiveWithAuthorization `to` must be the GasXSettlementRouter (the choke-point)");
  }
  if (!account.signTypedData) throw new Error("account cannot signTypedData");
  return account.signTypedData({
    domain,
    types: RECEIVE_WITH_AUTHORIZATION_TYPES,
    primaryType: "ReceiveWithAuthorization",
    message: auth,
  });
}

/** A cryptographically-random 32-byte EIP-3009 nonce (uses the platform CSPRNG; never Math.random). */
export function randomNonce(): `0x${string}` {
  const bytes = new Uint8Array(32);
  const c = (globalThis as { crypto?: { getRandomValues<T extends ArrayBufferView>(a: T): T } }).crypto;
  if (!c) throw new Error("no Web Crypto (globalThis.crypto) available for randomNonce");
  c.getRandomValues(bytes);
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}
