/**
 * @gasx/contracts — published ABIs and addresses for the GasX paymaster protocol.
 *
 * ABIs are generated from the Foundry build output; addresses carry the canonical
 * EntryPoint v0.9 plus a per-chain deployments map.
 */

export {
  GasXPolicyManagerAbi,
  GasXPaymasterBaseAbi,
  GasXWhitelistPaymasterAbi,
  GasXERC20FeePaymasterAbi,
  IGasXPolicyManagerAbi,
  IGasXPaymasterStrategyAbi,
  GasXPolicyLibAbi,
} from "./abis.js";

export { ENTRYPOINT_V09, deployments } from "./addresses.js";
export type { GasXDeployment } from "./addresses.js";
