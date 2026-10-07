/**
 * Builds, simulates, signs and sends restore/extend transactions.
 * Does not decide which entries need action; that is run.ts's job.
 */
import {
  Keypair,
  Operation,
  SorobanDataBuilder,
  TransactionBuilder,
  rpc,
  xdr,
} from "@stellar/stellar-sdk";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function send(
  server: rpc.Server,
  kp: Keypair,
  passphrase: string,
  op: xdr.Operation,
  data: xdr.SorobanTransactionData,
  maxFeeStroops: number,
): Promise<string> {
  const account = await server.getAccount(kp.publicKey());
  // "100" is a placeholder fee; the real fee comes from prepareTransaction.
  const built = new TransactionBuilder(account, { fee: "100", networkPassphrase: passphrase })
    .setSorobanData(data)
    .addOperation(op)
    // seconds, not ledgers
    .setTimeout(60)
    .build();

  // prepareTransaction simulates and fills in the resource fee and footprint.
  // The maxFeeStroops ceiling is checked after simulation and before signing.
  const prepared = await server.prepareTransaction(built);
  if (Number(prepared.fee) > maxFeeStroops) {
    throw new Error(`Fee ${prepared.fee} stroops is above maxFeeStroops (${maxFeeStroops}). Nothing was sent.`);
  }
  prepared.sign(kp);

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error(`Network rejected the transaction: ${JSON.stringify(sent.errorResult ?? sent)}`);

  // Wait up to 30 x 2s = 1 minute for the transaction to land.
  for (let i = 0; i < 30; i++) {
    const r = await server.getTransaction(sent.hash);
    const s = String(r.status);
    if (s === "SUCCESS") return sent.hash;
    if (s === "FAILED") throw new Error(`Transaction ${sent.hash} failed on the network`);
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for transaction ${sent.hash}`);
}

/**
 * Extend the TTL of the given entries to `extendTo` ledgers from now.
 * Entries must be live (not archived), so restore expired ones first.
 */
export function sendExtend(
  server: rpc.Server,
  kp: Keypair,
  passphrase: string,
  keys: xdr.LedgerKey[],
  extendTo: number,
  maxFeeStroops: number,
): Promise<string> {
  // Extend only reads the entries, so they go in the read-only footprint.
  const data = new SorobanDataBuilder().setReadOnly(keys).build();
  return send(server, kp, passphrase, Operation.extendFootprintTtl({ extendTo }), data, maxFeeStroops);
}

/**
 * Restore archived entries. A restore must go in its own transaction; extend
 * the same entries afterwards in a separate transaction.
 */
export function sendRestore(
  server: rpc.Server,
  kp: Keypair,
  passphrase: string,
  keys: xdr.LedgerKey[],
  maxFeeStroops: number,
): Promise<string> {
  // Restore writes the entries back, so they go in the read-write footprint.
  const data = new SorobanDataBuilder().setReadWrite(keys).build();
  return send(server, kp, passphrase, Operation.restoreFootprint({}), data, maxFeeStroops);
}
