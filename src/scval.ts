/**
 * Converts a JSON key description from the config into an xdr.ScVal.
 * Pure conversion: no RPC calls and no knowledge of which keys exist.
 */
import { Address, nativeToScVal, xdr } from "@stellar/stellar-sdk";
import type { KeySpec } from "./types";

/**
 * Encode a config KeySpec as the ScVal used to build a ledger key.
 * @throws when spec.type is not one of the supported KeySpec types.
 */
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
