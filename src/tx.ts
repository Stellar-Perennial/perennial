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
  const built = new TransactionBuilder(account, { fee: "100", networkPassphrase: passphrase })
    .setSorobanData(data)
    .addOperation(op)
    .setTimeout(60)
    .build();

  // Simulates the transaction and fills in the resource fee and footprint.
  const prepared = await server.prepareTransaction(built);
  if (Number(prepared.fee) > maxFeeStroops) {
    throw new Error(`Fee ${prepared.fee} stroops is above maxFeeStroops (${maxFeeStroops}). Nothing was sent.`);
  }
  prepared.sign(kp);

  const sent = await server.sendTransaction(prepared);
  if (sent.status === "ERROR") throw new Error(`Network rejected the transaction: ${JSON.stringify(sent.errorResult ?? sent)}`);

  for (let i = 0; i < 30; i++) {
    const r = await server.getTransaction(sent.hash);
    const s = String(r.status);
    if (s === "SUCCESS") return sent.hash;
    if (s === "FAILED") throw new Error(`Transaction ${sent.hash} failed on the network`);
    await sleep(2000);
  }
  throw new Error(`Timed out waiting for transaction ${sent.hash}`);
}

/** Extend the TTL of the given entries to `extendTo` ledgers from now. */
export function sendExtend(
  server: rpc.Server,
  kp: Keypair,
  passphrase: string,
  keys: xdr.LedgerKey[],
  extendTo: number,
  maxFeeStroops: number,
): Promise<string> {
  const data = new SorobanDataBuilder().setReadOnly(keys).build();
  return send(server, kp, passphrase, Operation.extendFootprintTtl({ extendTo }), data, maxFeeStroops);
}

/** Restore archived entries. A restore must be in its own transaction. */
export function sendRestore(
  server: rpc.Server,
  kp: Keypair,
  passphrase: string,
  keys: xdr.LedgerKey[],
  maxFeeStroops: number,
): Promise<string> {
  const data = new SorobanDataBuilder().setReadWrite(keys).build();
  return send(server, kp, passphrase, Operation.restoreFootprint({}), data, maxFeeStroops);
}
