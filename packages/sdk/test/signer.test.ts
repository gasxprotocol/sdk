import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress, keccak256, toHex } from "viem";
import { GasXOracleSigner } from "../src/GasXOracleSigner.js";
import { gasxDomain, SIGNED_APPROVAL_TYPES, SIGNED_APPROVAL_TYPE_STRING, APPROVAL_TYPEHASH } from "../src/domain.js";

describe("GasXOracleSigner", () => {
  const approval = {
    campaignId: ("0x" + "11".repeat(32)) as `0x${string}`,
    sender: "0x000000000000000000000000000000000000dEaD" as `0x${string}`,
    userOpHash: ("0x" + "22".repeat(32)) as `0x${string}`,
    maxFeeWei: 1_000_000_000_000_000_000n,
    validAfter: 0,
    validUntil: 4_000_000_000,
    eligibilityRef: ("0x" + "33".repeat(32)) as `0x${string}`,
  } as const;

  it("produces a signature the on-chain domain recovers to the signer", async () => {
    const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    const signer = new GasXOracleSigner(account);
    const domain = gasxDomain({ chainId: 421614, verifyingContract: "0x1111111111111111111111111111111111111111" });

    const sig = await signer.sign(domain, approval);
    const recovered = await recoverTypedDataAddress({
      domain,
      types: SIGNED_APPROVAL_TYPES,
      primaryType: "SignedApproval",
      message: approval,
      signature: sig,
    });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("type string hashes to the on-chain GasXPolicyLib.APPROVAL_TYPEHASH (cross-side anchor)", () => {
    // If the off-chain type string ever drifts from the on-chain one, this breaks before any signature does.
    expect(keccak256(toHex(SIGNED_APPROVAL_TYPE_STRING))).toBe(APPROVAL_TYPEHASH);
  });

  it("different verifyingContract => different signer recovery domain (cross-deploy isolation)", async () => {
    const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
    const signer = new GasXOracleSigner(account);
    const sig = await signer.sign(
      gasxDomain({ chainId: 421614, verifyingContract: "0x1111111111111111111111111111111111111111" }),
      approval,
    );
    // recovering under a DIFFERENT verifyingContract must NOT yield the signer
    const recovered = await recoverTypedDataAddress({
      domain: gasxDomain({ chainId: 421614, verifyingContract: "0x2222222222222222222222222222222222222222" }),
      types: SIGNED_APPROVAL_TYPES,
      primaryType: "SignedApproval",
      message: approval,
      signature: sig,
    });
    expect(recovered.toLowerCase()).not.toBe(account.address.toLowerCase());
  });
});
