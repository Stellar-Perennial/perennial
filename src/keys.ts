/**
 * Builds xdr.LedgerKey objects for the entries Perennial watches.
 * Pure builders: no RPC calls and no config parsing.
 */
import { Address, xdr } from "@stellar/stellar-sdk";
import { toScVal } from "./scval";
import type { Durability, KeySpec } from "./types";

/**
 * Ledger key of the contract instance entry. It is always persistent, and there
 * is exactly one per contract.
 */
export function instanceKey(contractId: string): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(contractId).toScAddress(),
      key: xdr.ScVal.scvLedgerKeyContractInstance(),
      durability: xdr.ContractDataDurability.persistent(),
    }),
  );
}

/** Ledger key of a wasm code entry. The hash comes from the instance entry (see scan.ts). */
export function codeKey(wasmHash: Buffer): xdr.LedgerKey {
  return xdr.LedgerKey.contractCode(new xdr.LedgerKeyContractCode({ hash: wasmHash }));
}

/** Ledger key of one data entry, built from the config key spec and durability. */
export function dataKey(contractId: string, spec: KeySpec, durability: Durability): xdr.LedgerKey {
  return xdr.LedgerKey.contractData(
    new xdr.LedgerKeyContractData({
      contract: new Address(contractId).toScAddress(),
      key: toScVal(spec),
      durability:
        durability === "persistent"
          ? xdr.ContractDataDurability.persistent()
          : xdr.ContractDataDurability.temporary(),
    }),
  );
}
