# GasX SDK

The public off-chain integration layer for **GasX** — an on-chain aggregate spend-ceiling for agent fleets,
whose proven instance today is a modular ERC-4337 gas-sponsorship paymaster
(contracts: [`gasxprotocol/contracts`](https://github.com/gasxprotocol/contracts)).

| Package | What |
|---|---|
| [`@gasx/sdk`](./packages/sdk) | EIP-712 `SignedApproval` signer, ERC-7677 orchestrator (`paymasterAndData` encoder matching the on-chain wire layout), strategy registry, and account adapter (raw-userOpHash signing, tuple `Call[]` batch). |
| [`@gasx/contracts`](./packages/contracts) | viem-ready ABIs + the canonical EntryPoint v0.9 address + a per-chain deployments map. |

```bash
npm i @gasx/sdk @gasx/contracts
```

These packages produce the approvals + `paymasterAndData` that the on-chain `GasXPaymasterBase` verifies.
The **operational** oracle-signer service (signing key + eligibility/budget policy) is intentionally NOT here —
it lives private and *consumes* `@gasx/sdk`.

Each package is standalone: `cd packages/<name> && npm install && npm run build && npm test`.

MIT.
