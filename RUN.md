# Running the Eval Codex

Two ways to run. The proxy way keeps your API key out of the browser entirely.

## Recommended: local proxy (key never enters the browser)

Your key is read from a dedicated environment variable,
`ANTHROPIC_LEARN_AI_EVAL_TUTOR`, and injected server-side. The browser only ever
talks to localhost and never sees the key.

1. One-time: set the dedicated key (use a spend-capped key, NOT your main one):
   ```powershell
   [Environment]::SetEnvironmentVariable('ANTHROPIC_LEARN_AI_EVAL_TUTOR','sk-ant-...','User')
   ```
   Then open a fresh terminal so it's picked up.
2. Open a terminal in this folder.
3. Run:
   ```
   node proxy.js
   ```
4. Open **http://127.0.0.1:8791** in your browser.
5. Click ⚙ only to pick a model (Sonnet 4.6 default). No key needed in the browser.
6. Stop the server with **Ctrl+C** when done.

Security notes:
- The proxy binds to `127.0.0.1` only — it is not reachable from your network.
- It is not a generic relay: it whitelists fields and only ever calls Anthropic.
- The key is never written to disk by this app and never sent to the browser.
- Don't change the bind host to `0.0.0.0` — that would expose your key to the LAN.

## Fallback: open the file directly (key stored in the browser)

1. Double-click `index.html` (opens as `file://`).
2. Click ⚙, paste a **dedicated, spend-capped** Anthropic key, pick a model, Save.
3. The key lives in this browser's localStorage. Don't host this file publicly
   with a key saved.

## Cost

Each tutoring turn is one API call (Sonnet, `max_tokens` 2000) — roughly a few
cents per session. Set a monthly spend cap on the key's workspace in the Anthropic
Console as a backstop.
