Attach a Mermaid diff diagram to PR #{NUMBER} in {OWNER}/{REPO}.

PR details:
- URL: {URL}
- Base branch: {BASE}
- Head branch: {HEAD}

Follow the workflow in your subagent definition exactly. Specifically:

- Cap the diagram at ~30 nodes.
- Use **human-readable labels** for every node and subgraph (e.g. "Sign in",
  "Auth token", "User database"). NEVER use filenames, paths, or file
  extensions. The reader is non-technical.
- Open the comment with a 2–4 sentence plain-English summary of what the PR
  changes at a system level — what's added, what's modified, what's removed.
  No code names.
- Highlight added/modified/removed files with the classDef styles in your
  instructions. Use solid edges for unchanged connections, dotted for
  added/removed.

If validation fails twice, post a fenced text block listing the changed files
instead of broken Mermaid.

Return one line: "Posted: <url>" on success, or "Failed: <reason>".
