import {
  type Address,
  type Hex,
  type Account,
  encodeFunctionData,
  concatHex,
  getContractAddress,
  keccak256,
  encodePacked,
} from "viem";
import type { Call, IGasXAccountAdapter } from "./IGasXAccountAdapter.js";

const EXECUTE_ABI = [
  {
    type: "function",
    name: "execute",
    inputs: [
      { name: "dest", type: "address" },
      { name: "value", type: "uint256" },
      { name: "func", type: "bytes" },
    ],
  },
] as const;

// v0.9 BaseAccount.executeBatch(Call[]), Call = (address target, uint256 value, bytes data) => selector 0x34fcd5be.
const EXECUTE_BATCH_ABI = [
  {
    type: "function",
    name: "executeBatch",
    inputs: [
      {
        name: "calls",
        type: "tuple[]",
        components: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
    ],
  },
] as const;

/** Simple-kind GasX account adapter. ONE account per (owner,chainId); RAW userOpHash signing; tuple batch. */
export class GasXSimpleAccountAdapter implements IGasXAccountAdapter {
  readonly kind = "simple" as const;

  constructor(
    private readonly cfg: {
      factory: Address;
      entryPoint: Address;
      /** Production resolver: factory.getAddress(owner, salt) over RPC (the authoritative deployed address). */
      resolveAddressOnChain?: (owner: Address, salt: Hex) => Promise<Address>;
    },
  ) {}

  private salt(owner: Address, chainId: number): Hex {
    return keccak256(encodePacked(["address", "uint256"], [owner, BigInt(chainId)]));
  }

  async getAddress(owner: Address, chainId: number): Promise<Address> {
    const salt = this.salt(owner, chainId);
    if (this.cfg.resolveAddressOnChain) return this.cfg.resolveAddressOnChain(owner, salt);
    // Offline DETERMINISTIC identity — one account per (owner,chainId) [STATE 2.3]. The DEPLOYABLE address is
    // resolved in production via factory.getAddress(owner,salt) over RPC (set resolveAddressOnChain); the real
    // factory CREATE2 match is proven by the on-chain fork test.
    return getContractAddress({ from: this.cfg.factory, opcode: "CREATE2", salt, bytecodeHash: salt });
  }

  async getInitCode(owner: Address, chainId: number): Promise<Hex> {
    const salt = this.salt(owner, chainId);
    const createCall = encodeFunctionData({
      abi: [
        {
          type: "function",
          name: "createAccount",
          inputs: [
            { name: "owner", type: "address" },
            { name: "salt", type: "uint256" },
          ],
        },
      ],
      functionName: "createAccount",
      args: [owner, BigInt(salt)],
    });
    return concatHex([this.cfg.factory, createCall]);
  }

  // AA24 fix: v0.9 SimpleAccount recovers over the RAW userOpHash (ECDSA.recover(userOpHash, sig)) — sign raw,
  // NOT EIP-191/EIP-712. Confirmed against SimpleAccount._validateSignature; exercised by the on-chain fork test.
  async signUserOpHash(userOpHash: Hex, signer: Account, _chainId: number): Promise<Hex> {
    if (!signer.sign) throw new Error("account cannot sign raw hashes");
    return signer.sign({ hash: userOpHash });
  }

  encodeExecute(target: Address, value: bigint, data: Hex): Hex {
    return encodeFunctionData({ abi: EXECUTE_ABI, functionName: "execute", args: [target, value, data] });
  }

  encodeBatch(calls: Call[]): Hex {
    return encodeFunctionData({
      abi: EXECUTE_BATCH_ABI,
      functionName: "executeBatch",
      args: [calls.map((c) => ({ target: c.to, value: c.value, data: c.data }))],
    });
  }
}
