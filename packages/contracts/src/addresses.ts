/**
 * Canonical and per-network addresses for the GasX protocol.
 */

/** ERC-4337 EntryPoint v0.9 — the canonical singleton GasX paymasters bind to. */
export const ENTRYPOINT_V09 = "0x433709009B8330FDa32311DF1C2AFA402eD8D009" as const;

/** A single GasX deployment on one network. */
export interface GasXDeployment {
  policyManager: `0x${string}`;
  whitelistPaymaster?: `0x${string}`;
  erc20FeePaymaster?: `0x${string}`;
}

/**
 * Per-chainId deployment map. Empty placeholder — populate with testnet/mainnet
 * addresses as deployments are published. Keyed by EIP-155 chain id.
 */
export const deployments: Record<number, GasXDeployment> = {};
