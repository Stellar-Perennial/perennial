import { describe, expect, it } from "vitest";
import { toScVal } from "../src/scval";

describe("toScVal", () => {
  it("encodes a u32", () => {
    expect(toScVal({ type: "u32", value: 7 }).u32()).toBe(7);
  });
  it("encodes a symbol", () => {
    expect(toScVal({ type: "symbol", value: "Admin" }).sym().toString()).toBe("Admin");
  });
  it("encodes a vec of symbol and u32 like a Rust enum key", () => {
    const v = toScVal({ type: "vec", value: [{ type: "symbol", value: "Count" }, { type: "u32", value: 1 }] });
    expect(v.vec()?.length).toBe(2);
  });
});
