import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { recoverAddress, getAddress } from "viem";
import type { IGasXAccountAdapter } from "../src/IGasXAccountAdapter.js";
import { BATCH_SELECTOR, EXECUTE_SELECTOR } from "../src/IGasXAccountAdapter.js";
import { GasXSimpleAccountAdapter } from "../src/GasXSimpleAccountAdapter.js";

const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

// Parameterized conformance — every IGasXAccountAdapter impl must pass this exact suite.
export function runAccountAdapterConformance(name: string, make: () => IGasXAccountAdapter) {
  describe(`IGasXAccountAdapter conformance: ${name}`, () => {
    it("getAddress is deterministic — ONE account per (owner,chainId) [STATE 2.3]", async () => {
      const a = make();
      const a1 = await a.getAddress(account.address, 421614);
      const a2 = await a.getAddress(account.address, 421614);
      expect(a1).toBe(a2);
      expect(getAddress(a1)).toBe(a1); // checksummed
      const aOtherChain = await a.getAddress(account.address, 84532);
      expect(aOtherChain).not.toBe(a1); // different chain => different account
    });

    it("signUserOpHash is RAW and recovers to the signer [AA24, STATE 2.1]", async () => {
      const a = make();
      const userOpHash = ("0x" + "22".repeat(32)) as `0x${string}`;
      const sig = await a.signUserOpHash(userOpHash, account, 421614);
      // v0.9 SimpleAccount does ECDSA.recover(userOpHash, sig) — recover over the RAW hash must yield the signer
      const recovered = await recoverAddress({ hash: userOpHash, signature: sig });
      expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
    });

    it("encodeExecute uses the execute selector 0xb61d27f6", () => {
      const data = make().encodeExecute("0x000000000000000000000000000000000000dEaD", 0n, "0x");
      expect(data.slice(0, 10)).toBe(EXECUTE_SELECTOR);
    });

    it("encodeBatch uses the tuple-form batch selector 0x34fcd5be [STATE 2.2]", () => {
      const data = make().encodeBatch([
        { to: "0x000000000000000000000000000000000000dEaD", value: 0n, data: "0x" },
        { to: "0x000000000000000000000000000000000000bEEF", value: 1n, data: "0xabcd" },
      ]);
      expect(data.slice(0, 10)).toBe(BATCH_SELECTOR);
    });
  });
}

runAccountAdapterConformance(
  "GasXSimpleAccountAdapter",
  () =>
    new GasXSimpleAccountAdapter({
      factory: "0x9406Cc6185a346906296840746125a0E44976454",
      entryPoint: "0x433709009B8330FDa32311DF1C2AFA402eD8D009",
    }),
);
