import { describe, expect, it } from "vitest";
import { classify, ledgersToDays } from "../src/scan";

describe("classify", () => {
  it("marks entries the RPC did not return as missing", () => {
    expect(classify(undefined, 1000)).toBe("missing");
  });
  it("marks zero or negative remaining ledgers as expired", () => {
    expect(classify(0, 1000)).toBe("expired");
    expect(classify(-5, 1000)).toBe("expired");
  });
  it("marks entries under the threshold as expiring", () => {
    expect(classify(999, 1000)).toBe("expiring");
  });
  it("marks entries at or above the threshold as ok", () => {
    expect(classify(1000, 1000)).toBe("ok");
    expect(classify(50000, 1000)).toBe("ok");
  });
});

describe("ledgersToDays", () => {
  it("converts using the 5 second estimate", () => {
    expect(ledgersToDays(17280)).toBe(1); // 17280 * 5s = 86400s = 1 day
    expect(ledgersToDays(120960)).toBe(7);
  });
});
