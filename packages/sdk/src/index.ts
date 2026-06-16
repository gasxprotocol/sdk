/**
 * @gasx/sdk — off-chain half of the GasX paymaster protocol.
 *
 * Public API: the EIP-712 oracle signer, the off-chain strategy registry, the ERC-7677 orchestrator
 * (`pm_getPaymasterData` / `pm_getPaymasterStubData`), the `paymasterAndData` encoder whose byte layout
 * matches `GasXPaymasterBase._decodeApproval`, and the account-adapter abstraction. The EIP-712 domain,
 * type definition, and frozen `APPROVAL_TYPEHASH` are the cross-side anchors with the on-chain contracts.
 */

// EIP-712 domain + types (cross-side anchors with GasXPolicyLib / GasXPaymasterBase)
export {
  gasxDomain,
  SIGNED_APPROVAL_TYPES,
  SIGNED_APPROVAL_TYPE_STRING,
  APPROVAL_TYPEHASH,
} from "./domain.js";

// Core SignedApproval shape
export type { SignedApproval } from "./types.js";

// Oracle signer
export { GasXOracleSigner } from "./GasXOracleSigner.js";

// Strategy registry (off-chain swap plane)
export { GasXStrategyRegistry } from "./GasXStrategyRegistry.js";
export type { StrategyDescriptor } from "./GasXStrategyRegistry.js";

// ERC-7677 orchestrator
export { GasXOrchestrator } from "./GasXOrchestrator.js";
export type { GasXContext, ResolvedPaymaster } from "./GasXOrchestrator.js";

// paymasterAndData encoder
export { encodePaymasterAndData } from "./encodePaymasterData.js";

// Account adapter abstraction + selectors
export type { Call, IGasXAccountAdapter } from "./IGasXAccountAdapter.js";
export { BATCH_SELECTOR, EXECUTE_SELECTOR } from "./IGasXAccountAdapter.js";
export { GasXSimpleAccountAdapter } from "./GasXSimpleAccountAdapter.js";
