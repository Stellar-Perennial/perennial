import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import type { KeySpec } from "./types";

/** Turn a JSON key description from the config into a Soroban ScVal. */
export function toScVal(spec: KeySpec): xdr.ScVal {
  switch (spec.type) {
    case "symbol":
      return xdr.ScVal.scvSymbol(spec.value);
    case "string":
      return xdr.ScVal.scvString(spec.value);
    case "bool":
      return xdr.ScVal.scvBool(spec.value);
    case "u32":
      return xdr.ScVal.scvU32(spec.value);
    case "u64":
      return nativeToScVal(BigInt(spec.value), { type: "u64" });
    case "i128":
      return nativeToScVal(BigInt(spec.value), { type: "i128" });
    case "address":
      return new Address(spec.value).toScVal();
    case "vec":
      return xdr.ScVal.scvVec(spec.value.map(toScVal));
    case "xdr":
      return xdr.ScVal.fromXDR(spec.value, "base64");
    default:
      throw new Error(`Unsupported key type: ${(spec as { type: string }).type}`);
  }
}
