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
