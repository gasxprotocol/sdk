import { describe, it, expect } from "vitest";
import { GasXPolicyManagerAbi, ENTRYPOINT_V09 } from "../src/index.js";

describe("@gasx/contracts", () => {
  it("GasXPolicyManager ABI exposes consumeUpTo", () => {
    const fn = GasXPolicyManagerAbi.find(
      (e) => e.type === "function" && e.name === "consumeUpTo",
    );
    expect(fn).toBeDefined();
  });

  it("ENTRYPOINT_V09 is the canonical EntryPoint v0.9 address", () => {
    expect(ENTRYPOINT_V09).toBe("0x433709009B8330FDa32311DF1C2AFA402eD8D009");
  });
});
