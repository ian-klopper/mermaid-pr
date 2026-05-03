# mermaid-pr

A Claude Code skill that drops a plain-English architecture diagram into every PR your agent opens. Color-coded by what changed, no filenames, no jargon. Reviewers see the structural change at a glance.

## What it looks like

Here's what the skill posts on a fictional PR that adds Google OAuth sign-in alongside an existing password flow, and removes the legacy password-only path. This is the actual comment shape — plain-English summary, fenced ```mermaid block, legend.

> ## What this PR changes
>
> This PR adds Google OAuth sign-in alongside the existing password flow. Users can now sign in with their Google account, receive a short-lived access token plus a refresh token, and stay logged in across sessions. The deprecated password-only sign-in path and its plain-text password helper have been removed; the auth middleware was updated to recognize the new tokens.

```mermaid
graph LR
  classDef added fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#064e3b;
  classDef modified fill:#fffbe6,stroke:#f59e0b,stroke-width:2px,color:#78350f;
  classDef removed fill:#fee2e2,stroke:#ef4444,stroke-width:2px,stroke-dasharray:5 3,color:#7f1d1d;

  subgraph frontend["Frontend"]
    login_page["Sign-in page"]
    google_button["Google sign-in button"]
    account_page["Account page"]
  end

  subgraph auth["Authentication"]
    sign_in["Sign in"]
    oauth_callback["OAuth callback"]
    token_issuer["Auth token"]
    legacy_login["Password sign-in (deprecated)"]
    plaintext_helper["Plain-text password helper"]
  end

  subgraph api["API"]
    api_entry["API entry point"]
    auth_middleware["Auth check"]
  end

  subgraph data["Data"]
    user_db["User database"]
    refresh_store["Refresh tokens"]
  end

  login_page --> sign_in
  login_page -.-> google_button
  google_button -.-> oauth_callback
  oauth_callback -.-> token_issuer
  sign_in -.-> token_issuer
  sign_in -. removed .-> legacy_login
  legacy_login -. removed .-> plaintext_helper
  token_issuer -.-> refresh_store
  account_page --> api_entry
  api_entry --> auth_middleware
  auth_middleware -.-> token_issuer
  auth_middleware --> user_db
  sign_in --> user_db

  class google_button added
  class oauth_callback added
  class token_issuer added
  class refresh_store added
  class login_page modified
  class sign_in modified
  class api_entry modified
  class auth_middleware modified
  class user_db modified
  class legacy_login removed
  class plaintext_helper removed
```

Every node is a human-readable label — no filenames, no paths, no extensions. Subgraphs group by purpose ("Authentication") rather than by directory ("src/auth"). A non-engineer can read this and understand the PR.

## Install

Paste this to your agent and it'll handle the rest:

> Install mermaid-pr for me. Repo: https://github.com/ian-klopper/mermaid-pr. Clone it to my Desktop, run `install.sh`, and make sure `gh` is installed and authenticated. Confirm when done.

The agent clones the repo, symlinks the skill into `~/.claude/`, and walks through `gh` setup. Restart Claude Code afterwards so it picks up the new skill.

## Use it

From here on, the diagram attaches automatically the next time your agent opens a PR. To put one on an existing PR, paste:

> Run mermaid-pr on PR #123.

## What the colors mean

- 🟢 green node — added in this PR
- 🟡 yellow node — modified
- 🔴 red dashed node — removed
- **solid** arrow — pre-existing connection
- **dotted** arrow — connection added or removed in this PR

Capped at ~30 nodes per diagram so it stays readable.

## When something looks off

- **No diagram on the PR** → ask your agent to confirm `gh` is installed and authenticated.
- **Diagram didn't render on GitHub** → ask your agent to re-run mermaid-pr on the PR. Usually a one-shot fix.
- **Two diagrams on one PR** → delete the older comment manually. Subsequent runs will edit the remaining one.
- **Skill not appearing** → ask your agent to check that `~/.claude/skills/mermaid-pr` exists and points to the cloned repo.

<details>
<summary>For engineers digging into the source</summary>

The skill ships in two pieces:

- `skill/SKILL.md` — runs in the parent Claude Code session and dispatches the work.
- `agent/mermaid-pr.md` — runs in a fresh, isolated context, analyzes the PR diff, generates the Mermaid graph, validates it, and posts (or updates) a sticky PR comment.

Layout:

| Path | Purpose |
|---|---|
| `skill/SKILL.md` | Dispatcher — short instructions for the parent Claude |
| `agent/mermaid-pr.md` | Worker — full self-contained subagent definition |
| `bin/validate-mermaid.mjs` | Pre-post syntax check (structural; no deps) |
| `examples/prompt-template.md` | Exact prompt the skill passes to the subagent |
| `examples/sample-diff-diagram.mmd` | Reference output to anchor the subagent on |
| `install.sh` | Symlinks skill + subagent into `~/.claude/` |

**Self-update.** The dispatcher checks the GitHub repo for newer commits on every run (rate-limited to once per 24h, skipped if the working tree is dirty), fast-forwards if behind, and asks the subagent to add a one-line acknowledgement footer to the PR comment when an update was just pulled.

**Triggering.** The skill activates two ways:
1. Its `description` says "Use immediately after `gh pr create` succeeds" — Claude Code's skill discovery picks this up.
2. A one-line nudge in `~/.claude/CLAUDE.md` reinforces it for sessions where description matching alone isn't enough.

**Verifying the validator** (only useful when hacking on the diagram generator):

```bash
node bin/validate-mermaid.mjs examples/sample-diff-diagram.mmd   # exit 0
```

</details>
