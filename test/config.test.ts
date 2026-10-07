import { describe, expect, it } from "vitest";
import { parseConfig } from "../src/config";

// Valid contract ID format check happens inside parseConfig via StrKey.
// Replace this with a real testnet contract ID if the check below fails in your setup.
const VALID_CONTRACT = "CA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";

const base = { network: "testnet", contracts: [{ id: VALID_CONTRACT }] };

describe("parseConfig", () => {
  it("applies defaults", () => {
    const cfg = parseConfig(base);
    expect(cfg.thresholdLedgers).toBe(120960);
    expect(cfg.extendToLedgers).toBe(518400);
    expect(cfg.secretEnv).toBe("PERENNIAL_SECRET");
  });
  it("rejects an unknown network", () => {
    expect(() => parseConfig({ ...base, network: "nope" })).toThrow();
  });
  it("requires rpcUrl on mainnet", () => {
    expect(() => parseConfig({ ...base, network: "mainnet" })).toThrow(/rpcUrl/);
  });
  it("requires extendToLedgers to exceed thresholdLedgers", () => {
    expect(() => parseConfig({ ...base, thresholdLedgers: 100, extendToLedgers: 100 })).toThrow();
  });
  it("rejects an invalid contract id", () => {
    expect(() => parseConfig({ ...base, contracts: [{ id: "not-a-contract" }] })).toThrow(/contract ID/);
  });
  it("rejects bad durability", () => {
    expect(() =>
      parseConfig({
        ...base,
        contracts: [{ id: VALID_CONTRACT, keys: [{ durability: "forever", key: { type: "symbol", value: "A" } }] }],
      }),
    ).toThrow(/durability/);
  });
});
