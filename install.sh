#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
AGENTS_DIR="$HOME/.claude/agents"

mkdir -p "$SKILLS_DIR" "$AGENTS_DIR"

ln -sfn "$DIR/skill" "$SKILLS_DIR/mermaid-pr"
ln -sfn "$DIR/agent/mermaid-pr.md" "$AGENTS_DIR/mermaid-pr.md"

echo "Installed:"
echo "  $SKILLS_DIR/mermaid-pr -> $DIR/skill"
echo "  $AGENTS_DIR/mermaid-pr.md -> $DIR/agent/mermaid-pr.md"
echo
echo "Next steps:"
echo "  1. (one-time) brew install gh && gh auth login"
echo "  2. Open a fresh Claude Code session and confirm 'mermaid-pr' is in the skills list."
