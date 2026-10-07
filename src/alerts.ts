/**
 * Builds and delivers alert messages to Slack, Telegram or a generic webhook.
 * The config holds only env var NAMES; the webhook URLs and tokens are read
 * from the environment at send time and never from the config file.
 */
import type { ActionResult, AlertConfig, EntryReport, ScanResult } from "./types";

/** One alert: a title plus one line per problem or action taken. */
export interface AlertMessage {
  title: string;
  lines: string[];
}

/** One human-readable line about an entry, used for console output and alerts. */
export function describe(e: EntryReport): string {
  const what = e.kind === "data" ? `${e.durability} key ${e.item}` : e.kind;
  const when =
    e.remainingLedgers === undefined
      ? "not returned by RPC"
      : `${e.remainingLedgers} ledgers left (~${e.approxRemainingDays} days)`;
  return `[${e.state}] ${e.contractLabel}: ${what}, ${when}`;
}

/** Returns undefined when everything is fine and nothing was done. */
export function buildMessage(network: string, scanResult: ScanResult, actions: ActionResult[]): AlertMessage | undefined {
  const problems = scanResult.entries.filter((e) => e.state !== "ok");
  if (problems.length === 0 && actions.length === 0) return undefined;
  const lines = problems.map(describe);
  for (const a of actions) {
    lines.push(`${a.action}: ${a.count} entries, ${a.status}${a.txHash ? ` (tx ${a.txHash})` : ""}${a.error ? ` - ${a.error}` : ""}`);
  }
  return { title: `Perennial (${network}): ${problems.length} entries need attention`, lines };
}

/** POST JSON and throw on a non-2xx response. */
async function post(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

/** Never throws. Returns a list of channel errors so the caller can print them. */
export async function sendAlerts(cfg: AlertConfig | undefined, msg: AlertMessage): Promise<string[]> {
  const errors: string[] = [];
  if (!cfg) return errors;
  const text = [msg.title, ...msg.lines].join("\n");

  if (cfg.slack) {
    const url = process.env[cfg.slack.webhookUrlEnv];
    if (!url) errors.push(`slack: env ${cfg.slack.webhookUrlEnv} is not set`);
    else await post(url, { text }).catch((e) => errors.push(`slack: ${e.message}`));
  }
  if (cfg.telegram) {
    const token = process.env[cfg.telegram.botTokenEnv];
    const chat = process.env[cfg.telegram.chatIdEnv];
    if (!token || !chat) errors.push("telegram: bot token or chat id env var is not set");
    else {
      await post(`https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chat, text }).catch((e) =>
        errors.push(`telegram: ${e.message}`),
      );
    }
  }
  if (cfg.webhook) {
    const url = process.env[cfg.webhook.urlEnv];
    if (!url) errors.push(`webhook: env ${cfg.webhook.urlEnv} is not set`);
    else await post(url, msg).catch((e) => errors.push(`webhook: ${e.message}`));
  }
  return errors;
}
