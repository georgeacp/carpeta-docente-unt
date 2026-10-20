# Carpeta Docente: review context

Resolve repository paths from the Git root. Read applicable `AGENTS.md` instructions, including `frontend/AGENTS.md` when reviewing frontend changes. This is a local review workflow; Git and file access suffice. GitHub access is optional for PR metadata and discussion.

## Scope

- Respect the user's explicit base, files, PR, or commit range.
- For uncommitted changes, collect `git status --short`, `git diff HEAD --`, and the contents of relevant untracked source/configuration files. If the user asks for staged changes only, use `git diff --cached --` instead. Never silently drop new untracked files or include unstaged changes in a staged-only review.
- For a branch review, verify the base exists and collect `git diff <base>...HEAD --`. Prefer the verified remote default branch (`git symbolic-ref --quiet refs/remotes/origin/HEAD`), falling back to verified `origin/main`, then `main`. A branch diff omits uncommitted changes: include those separately only when in scope, and label them.
- If the user gives no scope, review local changes when present; otherwise review the branch against the verified base. If neither yields a diff, report that there are no changes to review. Do not invent a base or expand to an unrelated whole-repository audit.
- Read full changed files and related code as needed, but report only problems introduced by the scoped changes. Avoid generated/build output, dependencies, `.env` contents, `backend/storage/`, and the local database unless directly relevant and authorized.

## Project conventions and checks

- Frontend: `frontend/` (Next.js, React, TypeScript); backend: `backend/` (FastAPI). Check installed manifests and local documentation before assuming library behavior. Use Context7 for library-specific documentation questions, following the project instructions.
- Preserve frontend semantic styling tokens, existing design primitives, and module boundaries described in `frontend/AGENTS.md`.
- When verification is relevant, use the existing scripts from the Git root: `npm run lint:anti-slop`, `npm --prefix frontend run lint`, and `npm --prefix frontend run build`. `npm run lint` chains the two lint steps and stops if the first fails.
- Choose checks that substantiate the findings; record failures and distinguish existing failures from regressions. Do not claim checks ran when they did not. No backend test command is configured in the root package scripts; inspect the actual backend tooling when a backend change needs verification.

## Report

Return a prioritized, deduplicated report in Spanish with file:line evidence, trigger/impact, and an actionable remedy. Keep speculative concerns separate from verified findings. State the reviewed scope and checks or limitations. Local review does not post comments, commit, or modify code; a request to fix findings is a separate implementation scope.
