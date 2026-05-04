---
name: mermaid-pr
description: Attach a plain-English summary + Mermaid diagram to a PR you just created. Use immediately after `gh pr create` succeeds (or any time the user asks for an architecture diagram on an existing PR). Dispatches the `mermaid-pr` subagent in a fresh context window; the subagent reads the changed files, writes a non-technical 2-4 sentence summary, draws a graph with human-readable labels (NOT filenames), and posts a sticky PR comment containing a fenced ```mermaid block that GitHub renders inline.
allowed-tools: Bash(gh pr view:*), Bash(gh pr create:*), Bash(git -C *:*), Bash(readlink:*), Bash(find:*), Bash(touch:*), Bash(test:*), Bash(dirname:*)
---

# mermaid-pr — dispatcher

This skill is a **dispatcher**. It does not analyze diffs, generate Mermaid, or post comments itself. It hands off to the `mermaid-pr` subagent (defined in `~/.claude/agents/mermaid-pr.md`), which runs in an isolated context and does the actual work.

## When to use

- Immediately after `gh pr create` succeeds in this session.
- When the user asks for "an architecture diagram on the PR" or "show me what this PR changes structurally."
- When the user explicitly invokes `/mermaid-pr`.

## Pre-dispatch: check for updates

Before dispatching the subagent, check whether this skill has a newer version on its origin remote. Run this single block — it sets `UPDATED_TO` and `UPDATE_SUBJECT` shell vars (empty if no update happened) for use in the dispatch step.

```bash
SKILL_DIR=$(readlink -f ~/.claude/skills/mermaid-pr 2>/dev/null || readlink ~/.claude/skills/mermaid-pr)
REPO_ROOT=$(dirname "$SKILL_DIR")
STAMP="$REPO_ROOT/.last-update-check"
UPDATED_TO=""
UPDATE_SUBJECT=""

# Rate-limit: skip the network round-trip if we checked in the last 24h.
if [ -f "$STAMP" ] && find "$STAMP" -mmin -1440 2>/dev/null | grep -q .; then
  :
# Skip if the working tree is dirty — never clobber in-progress edits.
elif [ -n "$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)" ]; then
  touch "$STAMP"
else
  PRE=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null)
  # Swallow network errors silently — never block the PR comment on a failed fetch.
  git -C "$REPO_ROOT" fetch origin --quiet 2>/dev/null
  AHEAD=$(git -C "$REPO_ROOT" rev-list HEAD..origin/main --count 2>/dev/null || echo 0)
  if [ "$AHEAD" -gt 0 ]; then
    git -C "$REPO_ROOT" pull --ff-only --quiet origin main 2>/dev/null
  fi
  POST=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null)
  touch "$STAMP"
  if [ -n "$PRE" ] && [ -n "$POST" ] && [ "$PRE" != "$POST" ]; then
    UPDATED_TO="$POST"
    UPDATE_SUBJECT=$(git -C "$REPO_ROOT" log -1 --format=%s 2>/dev/null)
    echo "mermaid-pr: self-updated to $UPDATED_TO ($UPDATE_SUBJECT)"
  fi
fi
```

If `UPDATED_TO` is non-empty, append the acknowledgement block (see "Inline prompt template" below) to the subagent prompt so it adds a footer line to the PR comment. Otherwise dispatch the prompt unchanged.

## How to dispatch

1. **Get PR metadata.** If a PR was just created, capture the number from the `gh pr create` output. Otherwise:

   ```bash
   gh pr view --json number,baseRefName,headRefName,url,headRepository,headRepositoryOwner -q '{number, base: .baseRefName, head: .headRefName, url, owner: .headRepositoryOwner.login, repo: .headRepository.name}'
   ```

2. **Determine `force`.** The subagent has an architectural-significance gate that skips trivial PRs (docs-only, test-only, lockfile bumps, single-file tweaks). Set `FORCE` based on how the skill was triggered:

   - `force=false` — auto-trigger after `gh pr create`. The gate decides whether to render.
   - `force=true` — user explicitly invoked `/mermaid-pr`, said "draw the diagram on PR #N", or asked for an architecture diagram on an existing PR. The gate is bypassed and a diagram is always rendered.

3. **Fill the prompt template** at `~/.claude/skills/mermaid-pr/../examples/prompt-template.md` (or use the inline copy below). Substitute `{NUMBER}`, `{OWNER}`, `{REPO}`, `{URL}`, `{BASE}`, `{HEAD}`, `{FORCE}`.

4. **Dispatch via the Agent tool:**

   ```
   Agent({
     subagent_type: "mermaid-pr",
     description: "Attach diff diagram to PR #N",
     prompt: <filled-in template>
   })
   ```

5. **Relay the subagent's one-line result** verbatim to the user. Do not embellish, do not re-explain, do not retry. The subagent returns one of:

   - `Posted: <url>` — diagram was rendered and posted.
   - `Skipped: not an architectural change` — gate fired; nothing was posted. This is the correct outcome on trivial PRs. Do not coerce it into a render.
   - `Failed: <reason>` — something went wrong; relay the reason as-is.

## Inline prompt template

```
Attach a Mermaid diff diagram to PR #{NUMBER} in {OWNER}/{REPO}.

PR details:
- URL: {URL}
- Base branch: {BASE}
- Head branch: {HEAD}
- Force: {FORCE}

Follow the workflow in your subagent definition exactly. Specifically:

- Run the architectural-significance gate (step 4) unless Force is true. On
  skip, return "Skipped: not an architectural change" without posting.
- Diagram nodes are **system components** — services, databases, queues,
  caches, frontends, workers, schedulers, external APIs. Never per-file
  nodes. No filenames, paths, or extensions anywhere in the diagram.
- Open the comment with a 2–4 sentence plain-English summary phrased at the
  component level — what new component or capability is added, what existing
  component changes, what is removed.
- Highlight added/modified/removed components with the classDef styles in
  your instructions. Solid edges for pre-existing connections, dotted for
  added/removed.
- Cap at ~30 components.

If validation fails twice, post a fenced text block listing the changed
components instead of broken Mermaid.

Return one line: "Posted: <url>", "Skipped: not an architectural change",
or "Failed: <reason>".
```

### Acknowledgement block (append only if `UPDATED_TO` is non-empty)

```
The skill self-updated to commit {UPDATED_TO} ("{UPDATE_SUBJECT}") just before
this run. After the diagram and legend, append a single italic footer line
to your PR comment acknowledging the update, exactly:

  _mermaid-pr auto-updated to {UPDATED_TO}_

One line. No emoji. Do not mention the update anywhere else in the comment.
```

## Critical: do not do the work yourself

Even if it seems faster, do not analyze the diff or generate Mermaid in the parent context. The whole point of this skill is to use a fresh subagent context.
