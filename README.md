# The Eval Codex

> A Claude-tutored engine for getting fluent in AI evaluation, fast — a gamified
> skill tree, spaced repetition, and an in-app tutor.

![The Eval Codex — a gamified skill tree of the AI-eval canon, tutored by Claude](docs/screenshot.png)

**What it is.** A personal learning engine for getting conversant in the
AI-evaluation canon and staying current. It turns the 13 core eval fundamentals
into a gamified skill tree, tutors each one with Claude through a spaced-repetition
loop grounded in canonical sources, and keeps a full audit trail of what was learned.

**What building it exercised** (the part a hiring manager cares about):
- **LLM integration** — the Anthropic API as a stateful, multi-step tutor with a
  structured pedagogy, not a chatbot wrapper.
- **Secret hygiene** — the API key is read from an env var by a localhost-only
  proxy and injected server-side; it never enters the browser or the repo.
- **Learning science as product mechanics** — retrieval practice, spaced review
  (expanding intervals), interleaving, and predict-then-test calibration are wired
  into the loop, not just mentioned.
- **Auditability** — append-only event log + readable per-session transcripts.
- **Eval domain** — the curriculum maps the canon: LLM-as-judge & its biases,
  eval datasets & contamination, metrics, agentic/trajectory eval, benchmarks &
  Goodhart, statistics for eval, RAG eval, red-teaming.

## How it works
- **Skill tree** — 13 nodes (the eval canon). Each: status `todo → gap → shaky →
  solid`, a canonical source anchor, the tutor loop.
- **Tutor loop (v2)** — predict your score → teach with two examples → you write
  notes in your own words → cold quiz → graded against your notes *and* the
  canonical anchor → mock-interview transfer question.
- **Spaced review** — solid nodes resurface on expanding intervals (1/3/7/16/35
  days); a "due" queue stops a sprint from evaporating before it's needed.
- **Audit trail** — every session, message, status change, and review is logged
  and exportable.

## Architecture
- `index.html` — single-file app, vanilla JS, no build step. Gamified UI, light/dark.
- `proxy.js` — zero-dependency Node relay. Reads the key from
  `ANTHROPIC_LEARN_AI_EVAL_TUTOR`, binds `127.0.0.1` only, injects the key
  server-side, and is not a generic relay (whitelists fields, only calls Anthropic).
- The key never lives in the repo or the browser. Full design + security notes in
  [`DESIGN.md`](./DESIGN.md).

## Run it
1. Set `ANTHROPIC_LEARN_AI_EVAL_TUTOR` to a (spend-capped) Anthropic API key.
2. `node proxy.js`
3. Open http://127.0.0.1:8791 — pick a model in ⚙, start a node.

See [`RUN.md`](./RUN.md) for the file:// fallback and details.

## Status
Frozen as-built baseline — see [`DESIGN.md`](./DESIGN.md) for problem, premises,
success criteria, the learning-science basis, and the security posture. Private
learning engine; structured to go public as a portfolio piece if I choose to.
