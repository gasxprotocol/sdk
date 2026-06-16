import { describe, it, expect } from "vitest";
import { GasXStrategyRegistry } from "../src/GasXStrategyRegistry.js";

const desc = {
  strategyId: ("0x" + "ab".repeat(32)) as `0x${string}`,
  kind: "gasx-whitelist" as const,
  paymaster: "0x1111111111111111111111111111111111111111" as `0x${string}`,
  policyManager: "0x2222222222222222222222222222222222222222" as `0x${string}`,
  chainId: 421614,
};

describe("GasXStrategyRegistry", () => {
  it("routes a campaign to its registered strategy", async () => {
    const reg = new GasXStrategyRegistry();
    reg.register(desc);
    reg.mapCampaign(421614, ("0x" + "11".repeat(32)) as `0x${string}`, desc.strategyId);
    const got = await reg.forCampaign(421614, ("0x" + "11".repeat(32)) as `0x${string}`);
    expect(got.paymaster).toBe(desc.paymaster);
  });

  it("throws on an unknown campaign (fail-closed)", async () => {
    const reg = new GasXStrategyRegistry();
    await expect(reg.forCampaign(421614, ("0x" + "99".repeat(32)) as `0x${string}`)).rejects.toThrow();
  });

  it("throws when the campaign maps to an unregistered strategy (fail-closed)", async () => {
    const reg = new GasXStrategyRegistry();
    reg.mapCampaign(421614, ("0x" + "11".repeat(32)) as `0x${string}`, ("0x" + "cd".repeat(32)) as `0x${string}`);
    await expect(reg.forCampaign(421614, ("0x" + "11".repeat(32)) as `0x${string}`)).rejects.toThrow();
  });
});
