# @gasx/sdk

Off-chain bridge for **GasX** — the gas-sponsorship paymaster instance of the on-chain aggregate spend-ceiling.
Produces the EIP-712 `SignedApproval`s that the on-chain `GasXPaymasterBase` verifies, and assembles
`paymasterAndData` byte-for-byte to the contract's wire layout.

- `GasXOracleSigner` — EIP-712 signer (domain matches the on-chain `GasXPaymasterBase`).
- `GasXOrchestrator` + `encodePaymasterAndData` — ERC-7677 surface (`pm_getPaymasterData`); 128-byte signed region + sig.
- `GasXStrategyRegistry` — campaign → strategy routing (fail-closed).
- `GasXSimpleAccountAdapter` / `IGasXAccountAdapter` — raw-userOpHash signing (AA24), tuple `Call[]` batch, one account per user.

```bash
npm i @gasx/sdk
```

```ts
import { GasXOracleSigner, gasxDomain, encodePaymasterAndData } from "@gasx/sdk";
```

Contracts: https://github.com/gasxprotocol/contracts · EntryPoint v0.9. MIT.
