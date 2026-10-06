# MoRe instructions for Antigravity / Gemini

Use `AGENTS.md` as the canonical project rules. Read it in full before making changes; do not maintain a separate copy of its rules here.

At the start of each task, read `docs/more.md`, `docs/ui-map.md`, and `docs/checklist.md`. Read the DBML specified in `AGENTS.md` before data-related work. Follow the latest recorded user decisions; older milestone notes are historical unless explicitly reaffirmed.

For a fresh clone, follow `README.md` before running the app. All paths are relative to the repository root. Environment keys, credentials, generated clients, model assets and the development database are machine-local; they do not transfer through Git.

Read the relevant installed Next.js documentation before writing Next.js code. Select applicable skills from `.agents/skills/`; read their `SKILL.md` and use only tools available in this environment. Skills or tool connections outside the repository may differ between editors.

Preserve user edits and existing UI/flows. Follow database approval rules in `AGENTS.md`, retain existing data and Demo isolation, and never expose national IDs or private environment values in logs. Report files changed, checks actually run and remaining limitations.

Project rule reference: @AGENTS.md

Antigravity supports directory-scoped `AGENTS.md` and `GEMINI.md`; see [Google's Rules documentation](https://www.antigravity.google/docs/rules/). This file points to shared rules rather than introducing editor-specific product behavior.
