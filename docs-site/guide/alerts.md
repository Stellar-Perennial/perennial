# Alerts

This page shows how to configure Slack, Telegram, and generic webhook alerts, and where the secrets go.

Alert channels are configured in the `alerts` object of the config file. The config holds only the **names of environment variables**; the actual URLs and tokens are read from the environment at runtime. Nothing sensitive belongs in the config file.

All three channels are optional. Set only the ones you use. Alerts are sent by `run`, `extend`, and `restore` (unless `--no-alerts`); `scan` never sends alerts. An alert goes out when at least one entry is not `ok`, or when at least one action ran.

## Slack

Config:

```json
{
  "alerts": {
    "slack": { "webhookUrlEnv": "SLACK_WEBHOOK_URL" }
  }
}
```

Then set the variable to an incoming webhook URL you created in Slack:

```bash
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

The message is sent as JSON `{"text": "..."}`.

## Telegram

Config:

```json
{
  "alerts": {
    "telegram": { "botTokenEnv": "TELEGRAM_BOT_TOKEN", "chatIdEnv": "TELEGRAM_CHAT_ID" }
  }
}
```

Environment variables:

```bash
export TELEGRAM_BOT_TOKEN=123456:ABC...
export TELEGRAM_CHAT_ID=-1001234567890
```

Perennial posts to `https://api.telegram.org/bot<token>/sendMessage` with `chat_id` and `text`. You create the bot with BotFather and get the chat ID from your own setup.

## Generic webhook

Config:

```json
{
  "alerts": {
    "webhook": { "urlEnv": "PERENNIAL_WEBHOOK_URL" }
  }
}
```

```bash
export PERENNIAL_WEBHOOK_URL=https://example.com/hook
```

Perennial POSTs the full message object as JSON:

```json
{
  "title": "Perennial (testnet): 2 entries need attention",
  "lines": ["[expired] my-contract: instance, 0 ledgers left (~0 days)"]
}
```

## All three at once

The example config `perennial.config.example.json` ships with all three channels using these exact variable names:

- Slack: `SLACK_WEBHOOK_URL`
- Telegram: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
- Webhook: `PERENNIAL_WEBHOOK_URL`

You can rename the variables by changing the `*Env` values in the config; the names are yours to choose. The signing key variable is separate (`secretEnv`, default `PERENNIAL_SECRET`) and is unrelated to alerts.

## Failure behavior

Alert delivery never crashes a run. If a URL or token variable is not set, or an HTTP request fails, Perennial prints `alert error: ...` to stderr and continues. The CLI exit code still reflects only the scan/action result.
