import type { Address, Hex, Account } from "viem";

export interface Call {
  to: Address;
  value: bigint;
  data: Hex;
}

/**
 * Plane 5 (off-chain side) — spec §6.4. Absorbs the STATE_ANALYSIS account breaks into one abstraction:
 *  - getAddress: ONE account per (owner,chainId) — fixes the dual-factory (STATE 2.3).
 *  - signUserOpHash: RAW userOpHash signing — v0.9 SimpleAccount recovers via ECDSA.recover(userOpHash,sig)
 *    (fixes AA24, STATE 2.1; the plan's EIP-712 "GasXAccount" domain would be rejected by the real account).
 *  - encodeBatch: tuple-form Call[] (selector 0x34fcd5be) — fixes STATE 2.2.
 */
export interface IGasXAccountAdapter {
  readonly kind: "simple" | "7702" | "7579";
  getAddress(owner: Address, chainId: number): Promise<Address>;
  getInitCode(owner: Address, chainId: number): Promise<Hex>;
  signUserOpHash(userOpHash: Hex, signer: Account, chainId: number): Promise<Hex>;
  encodeExecute(target: Address, value: bigint, data: Hex): Hex;
  encodeBatch(calls: Call[]): Hex;
}

/// SimpleAccount.executeBatch(Call[]) tuple-of-structs form (Call = (address,uint256,bytes)). Fixes STATE 2.2.
export const BATCH_SELECTOR: Hex = "0x34fcd5be";
/// SimpleAccount.execute(address,uint256,bytes).
export const EXECUTE_SELECTOR: Hex = "0xb61d27f6";
