import { describe, it, expect } from "vitest";
import { privateKeyToAccount } from "viem/accounts";
import { recoverTypedDataAddress, decodeFunctionData } from "viem";
import {
  RECEIVE_WITH_AUTHORIZATION_TYPES,
  tokenDomain,
  signReceiveAuthorization,
  randomNonce,
  type ReceiveAuthorization,
} from "../src/eip3009.js";
import {
  GASX_SETTLEMENT_ROUTER_ABI,
  encodeSettle,
  buildX402PaymentRequirements,
} from "../src/settlement.js";

const ROUTER = "0x2b458E6942d913e934208D0C09EC0307FECef351" as `0x${string}`;
const USDC = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d" as `0x${string}`;
const MERCHANT = "0x000000000000000000000000000000000000bEEF" as `0x${string}`;

describe("eip3009 receiveWithAuthorization", () => {
  const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  const domain = tokenDomain({ name: "USD Coin", version: "2", chainId: 421614, verifyingContract: USDC });

  it("signs an authorization the token domain recovers to the agent (to = the router)", async () => {
    const auth: ReceiveAuthorization = {
      from: account.address,
      to: ROUTER,
      value: 4_000_000n,
      validAfter: 0n,
      validBefore: 4_000_000_000n,
      nonce: ("0x" + "ab".repeat(32)) as `0x${string}`,
    };
    const sig = await signReceiveAuthorization(account, domain, auth);
    const recovered = await recoverTypedDataAddress({
      domain,
      types: RECEIVE_WITH_AUTHORIZATION_TYPES,
      primaryType: "ReceiveWithAuthorization",
      message: auth,
      signature: sig,
    });
    expect(recovered.toLowerCase()).toBe(account.address.toLowerCase());
  });

  it("refuses to sign with an unset `to` (must be the choke-point router)", async () => {
    await expect(
      signReceiveAuthorization(account, domain, {
        from: account.address,
        to: "0x0000000000000000000000000000000000000000",
        value: 1n,
        validAfter: 0n,
        validBefore: 4_000_000_000n,
        nonce: randomNonce(),
      })
    ).rejects.toThrow(/choke-point/);
  });

  it("randomNonce returns a 32-byte hex", () => {
    expect(randomNonce()).toMatch(/^0x[0-9a-f]{64}$/);
  });
});

describe("settlement encoding + x402 payment requirements", () => {
  it("encodeSettle round-trips through the router ABI", () => {
    const args = {
      campaignId: ("0x" + "c7".repeat(32)) as `0x${string}`,
      token: USDC,
      from: "0x000000000000000000000000000000000000a1a1" as `0x${string}`,
      merchant: MERCHANT,
      value: 4_000_000n,
      validAfter: 0n,
      validBefore: 4_000_000_000n,
      nonce: ("0x" + "ab".repeat(32)) as `0x${string}`,
      signature: ("0x" + "cd".repeat(65)) as `0x${string}`,
    };
    const data = encodeSettle(args);
    const decoded = decodeFunctionData({ abi: GASX_SETTLEMENT_ROUTER_ABI, data });
    expect(decoded.functionName).toBe("settle");
    expect(decoded.args[0]).toBe(args.campaignId);
    expect((decoded.args[3] as string).toLowerCase()).toBe(MERCHANT.toLowerCase());
    expect(decoded.args[4]).toBe(args.value);
  });

  it("buildX402PaymentRequirements routes payTo through the GasX router (the ceiling choke-point)", () => {
    const reqs = buildX402PaymentRequirements({
      router: ROUTER,
      token: USDC,
      maxAmountRequired: 4_000_000n,
      network: "arbitrum-sepolia",
      resource: "https://api.example.com/x",
      tokenName: "USD Coin",
    });
    expect(reqs.payTo).toBe(ROUTER); // NOT the merchant — that would bypass the cap
    expect(reqs.asset).toBe(USDC);
    expect(reqs.scheme).toBe("exact");
    expect(reqs.maxAmountRequired).toBe("4000000");
    expect(reqs.extra).toEqual({ name: "USD Coin", version: "2" });
  });
});
