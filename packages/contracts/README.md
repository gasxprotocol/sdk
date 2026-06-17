# @gasx/contracts

ABIs + canonical addresses for the **GasX** contracts (`gasxprotocol/contracts`) — the on-chain aggregate
spend-ceiling engine (`GasXPolicyManager`) and its modular ERC-4337 gas-sponsorship paymaster instance
(`GasXPaymasterBase`, `GasXWhitelistPaymaster`, `GasXERC20FeePaymaster`), plus the `IGasX*` interfaces and the
canonical EntryPoint v0.9 address.

```bash
npm i @gasx/contracts
```

```ts
import { GasXPolicyManagerAbi, ENTRYPOINT_V09 } from "@gasx/contracts";
```

MIT.
