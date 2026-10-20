---
name: thermos
description: "Combine independent correctness/security and maintainability reviews of a scoped diff. Use when the user requests Thermos or a double thermo review."
license: MIT
---

# Thermos

Run the two Thermos review passes independently, then synthesize their results. This project-local edition adapts Cursor's orchestration to the available Codex agent tools.

## Workflow

1. Read [project-context.md](references/project-context.md) for this repository's scope selection, conventions, and validation commands.
2. Collect the scoped diff and changed-file contents, including relevant callers and frontend/backend contracts. Give both reviewers the same scope and baseline.
3. When subagent tools are available, launch two independent review subagents in parallel (for example, Codex `collaboration.spawn_agent`). Each must read one complete rubric:
   - [thermo-nuclear-review](../thermo-nuclear-review/SKILL.md): bugs, breakages, security, developer workflow regressions, and feature-gate leaks.
   - [thermo-nuclear-code-quality-review](../thermo-nuclear-code-quality-review/SKILL.md): maintainability, structure, file-size growth, branching, abstractions, and boundaries.
   Ask each reviewer for evidence, priority, file:line references, and a concrete remedy; do not let them edit files or spawn nested reviewers.
4. Wait for both reviewers and inspect their results. If delegation is unavailable, perform both passes separately yourself and disclose that they ran sequentially. Cursor's `Task`, named `subagent_type`, and `run_in_background` parameters are not required in Codex.
5. Verify and deduplicate findings, resolve disagreements against the code, and report findings first in Spanish unless the user requests another language. Agreement alone does not prove a finding. Include remaining uncertainty and checks performed; explicitly state when no actionable findings were found.

If individual background summaries are already visible to the user, do not restate them wholesale. Surface the unified verdict, the highest-signal findings, and any remaining uncertainty.
