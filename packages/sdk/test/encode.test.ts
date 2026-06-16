import { describe, it, expect } from "vitest";
import { slice, hexToBigInt, hexToNumber } from "viem";
import { encodePaymasterAndData } from "../src/encodePaymasterData.js";
import { GasXOrchestrator } from "../src/GasXOrchestrator.js";
import type { SignedApproval } from "../src/types.js";

const approval: SignedApproval = {
  campaignId: ("0x" + "11".repeat(32)) as `0x${string}`,
  sender: "0x000000000000000000000000000000000000dEaD",
  userOpHash: ("0x" + "22".repeat(32)) as `0x${string}`, // signed but NOT in the wire pad
  maxFeeWei: 1_000_000_000_000_000_000n,
  validAfter: 0,
  validUntil: 4_000_000_000,
  eligibilityRef: ("0x" + "33".repeat(32)) as `0x${string}`,
};
const SIG = ("0x" + "ab".repeat(65)) as `0x${string}`;

describe("encodePaymasterAndData", () => {
  const out = encodePaymasterAndData({
    paymaster: "0x1111111111111111111111111111111111111111",
    paymasterVerificationGasLimit: 300_000n,
    paymasterPostOpGasLimit: 150_000n,
    approval,
    signature: SIG,
  });

  it("is the 52-byte offset + 128-byte signed region + 65-byte sig (245 bytes; userOpHash NOT in pad)", () => {
    expect((out.length - 2) / 2).toBe(20 + 16 + 16 + 128 + 65); // 245
  });

  it("round-trips at the exact offsets GasXPaymasterBase._decodeApproval reads", () => {
    // data = pad[52:]; campaignId data[0:32], sender data[32:52], maxFeeWei data[52:84],
    // validAfter data[84:90], validUntil data[90:96], eligibilityRef data[96:128], sig data[128:193]
    expect(slice(out, 52, 84)).toBe(approval.campaignId);
    expect(slice(out, 84, 104).toLowerCase()).toBe(approval.sender.toLowerCase());
    expect(hexToBigInt(slice(out, 104, 136))).toBe(approval.maxFeeWei);
    expect(hexToNumber(slice(out, 136, 142))).toBe(approval.validAfter);
    expect(hexToNumber(slice(out, 142, 148))).toBe(approval.validUntil);
    expect(slice(out, 148, 180)).toBe(approval.eligibilityRef);
    expect(slice(out, 180, 245)).toBe(SIG);
  });
});

describe("GasXOrchestrator (ERC-7677)", () => {
  const resolve = async () => ({
    paymaster: "0x1111111111111111111111111111111111111111" as `0x${string}`,
    verificationGasLimit: 300_000n,
    postOpGasLimit: 150_000n,
  });
  const orch = new GasXOrchestrator(resolve, async () => ({ approval, signature: SIG }));

  it("pm_getPaymasterData returns a 245-byte paymasterAndData", async () => {
    const { paymasterAndData } = await orch.pm_getPaymasterData(421614, { campaignId: approval.campaignId });
    expect((paymasterAndData.length - 2) / 2).toBe(245);
  });

  it("pm_getPaymasterStubData is same-length with a NON-ZERO trailing 65-byte sig", async () => {
    const { paymasterAndData } = await orch.pm_getPaymasterStubData(421614, { campaignId: approval.campaignId });
    expect((paymasterAndData.length - 2) / 2).toBe(245);
    expect(paymasterAndData.slice(-130)).toBe("01".repeat(65)); // dummy sig must be non-zero (gas estimation)
  });
});
