# CLAUDE.md

## Git workflow

For every change (fix or feature):

1. **Issue first**: create a GitHub issue (`gh issue create`) with a complete description:
   - **Problem**: what happens, where (page / file), and the root cause if known.
   - **Expected behaviour**.
   - **Proposed fix**: files and changes involved.
   - **Notes**: anything that needs extra steps (e.g. native rebuild, migration).
2. **Branch**: never commit directly on `master`. Create a branch named `fix/<issue#>-<short-slug>` or `feat/<issue#>-<short-slug>`.
3. **Commit**:
   - Short imperative subject line (≤ 72 chars).
   - Body explaining what changed and why, as bullet points.
   - End with `Closes #<issue#>`.
4. **Pull request**: open a PR against `master` (`gh pr create`) whose body starts with `Closes #<issue#>` and includes:
   - **Summary** of the change.
   - **Changes**, listed per file.
   - Formatting-only changes, if any (e.g. Prettier pre-commit hook, npm re-sorting `package.json`).
   - **Testing** checklist: tick only what was actually verified.
   - **Deployment notes** when relevant (e.g. `npm run build-ios` then rebuild in Xcode).

## Commit rules

- Commits must **NEVER** contain any reference to Claude or Anthropic: no `Co-Authored-By: Claude ...` trailer, no "Generated with Claude Code" line, no mention in the subject or body.
- The pre-commit hook runs `pretty-quick --staged` (Prettier), which may reformat staged files. Check the final diff after committing.
