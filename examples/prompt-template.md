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
