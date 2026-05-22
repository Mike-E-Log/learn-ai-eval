# Show HN — DRAFT (parked, do not post until public)

> These are launch drafts. The repo is private. Post only after you flip it public
> and have a screenshot in the README.

## Title options (pick one; A is the lead)
- **A.** Show HN: The Eval Codex – a Claude-tutored skill tree for learning AI evaluation
- B. Show HN: I built a spaced-repetition tutor to get fluent in AI evals
- C. Show HN: Learn the AI-eval canon with a Claude tutor and a localhost key proxy

## Body
I kept bouncing off "learn AI evaluation" because the canon is scattered across
papers, blog posts, and tool docs. So I built a learning engine for it.

The Eval Codex is a single-file web app + a tiny Node proxy. It turns the 13 core
eval fundamentals (LLM-as-judge, eval datasets & contamination, metrics, agentic
eval, benchmarks/Goodhart, stats for eval, RAG eval, red-teaming, ...) into a
gamified skill tree. Each node is tutored by Claude through a loop built on
learning-science: predict-your-score → teach with two examples → you write notes
in your own words → cold quiz → graded against your notes AND a canonical source →
a mock-interview transfer question. "Solid" nodes resurface on expanding
spaced-repetition intervals so a cram doesn't evaporate.

Two engineering bits I'm happy with:
- The Anthropic key never touches the browser. A localhost-only Node proxy reads it
  from an env var and injects it server-side; it's not a generic relay.
- Everything is logged to an append-only audit trail you can export.

It's vanilla JS, no build step, ~50KB. Feedback welcome — especially from people
who do eval for a living on what's missing from the 13-node canon.

Repo: https://github.com/Mike-E-Log/learn-ai-eval
