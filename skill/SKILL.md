---
name: mermaid-pr
description: Attach a Mermaid diff diagram to a PR you just created. Use immediately after `gh pr create` succeeds (or any time the user asks for an architecture diagram on an existing PR). Dispatches the `mermaid-pr` subagent in a fresh context window; the subagent analyzes the diff, builds a graph showing which files/modules changed and how the import edges shifted, and posts (or updates) a sticky PR comment containing a fenced ```mermaid block that GitHub renders inline.
allowed-tools: Bash(gh pr view:*), Bash(gh pr create:*)
---

# mermaid-pr — dispatcher

This skill is a **dispatcher**. It does not analyze diffs, generate Mermaid, or post comments itself. It hands off to the `mermaid-pr` subagent (defined in `~/.claude/agents/mermaid-pr.md`), which runs in an isolated context and does the actual work.

## When to use

- Immediately after `gh pr create` succeeds in this session.
- When the user asks for "an architecture diagram on the PR" or "show me what this PR changes structurally."
- When the user explicitly invokes `/mermaid-pr`.

## How to dispatch

1. **Get PR metadata.** If a PR was just created, capture the number from the `gh pr create` output. Otherwise:

   ```bash
   gh pr view --json number,baseRefName,headRefName,url,headRepository,headRepositoryOwner -q '{number, base: .baseRefName, head: .headRefName, url, owner: .headRepositoryOwner.login, repo: .headRepository.name}'
   ```

2. **Fill the prompt template** at `~/.claude/skills/mermaid-pr/../examples/prompt-template.md` (or use the inline copy below). Substitute `{NUMBER}`, `{OWNER}`, `{REPO}`, `{URL}`, `{BASE}`, `{HEAD}`.

3. **Dispatch via the Agent tool:**

   ```
   Agent({
     subagent_type: "mermaid-pr",
     description: "Attach diff diagram to PR #N",
     prompt: <filled-in template>
   })
   ```

4. **Relay the subagent's one-line result** verbatim to the user. Do not embellish, do not re-explain. The subagent returns either `Posted: <url>` or `Failed: <reason>`.

## Inline prompt template

```
Attach a Mermaid diff diagram to PR #{NUMBER} in {OWNER}/{REPO}.

PR details:
- URL: {URL}
- Base branch: {BASE}
- Head branch: {HEAD}

Follow the workflow in your subagent definition exactly. Cap the diagram at
~30 nodes. Highlight added/modified/removed files using the classDef styles
in your instructions. Use solid edges for unchanged imports and dotted edges
for added/removed imports.

If validation fails twice, post a fenced text block listing the changed files
instead of broken Mermaid.

Return one line: "Posted: <url>" on success, or "Failed: <reason>".
```

## Critical: do not do the work yourself

Even if it seems faster, do not analyze the diff or generate Mermaid in the parent context. The whole point of this skill is to use a fresh subagent context.
