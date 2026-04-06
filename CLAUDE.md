# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

smart-claude is a Claude Code `UserPromptSubmit` hook that analyzes prompts for token optimization opportunities. It runs automatically on every prompt, detects inefficiencies (filler phrases, duplicate intents, unnecessary preambles, context bloat), and outputs markdown suggestions as additional context.

## Commands

```bash
npm install          # Install dependencies
npm test             # Run all tests (node:test)

# Hook management
node bin/smart-claude.js install    # Add hook to ~/.claude/settings.json
node bin/smart-claude.js uninstall  # Remove hook
node bin/smart-claude.js status     # Show install status + session stats
node bin/smart-claude.js reset      # Reset session state

# Manual hook testing
echo '{"prompt": "your prompt"}' | node hook.js

# Standalone analysis
node bin/smart-claude.js analyze "your prompt here"
```

## Architecture

```
hook.js                    ← Claude Code UserPromptSubmit hook entry point
  ├─ src/analyzer.js       ← Orchestrator: tokenize + detect issues + compress
  │    ├─ src/tokenizer.js ← Token counting via gpt-tokenizer (GPT approximation)
  │    └─ src/rules.js     ← Detection rules + prompt compression
  ├─ src/session.js        ← Per-project session state (~/.smart-claude/session-<hash>.json)
  └─ src/formatter.js      ← Markdown output for hook context

bin/smart-claude.js        ← CLI for install/uninstall/status/reset/analyze (Commander)
```

### Data flow

1. Claude Code sends `{ prompt, session_id, ... }` JSON to hook.js via stdin
2. `analyzer.js` counts tokens, runs `rules.js` detection, and generates compressed alternative
3. `session.js` loads per-project state, detects cross-prompt patterns (growth, overlap, refinement), saves updated state
4. `formatter.js` produces markdown output only when there are actionable suggestions
5. stdout output becomes additional context visible to Claude

### Key design decisions

- **Silent when clean**: No output when prompt has no issues (< 5% savings, no patterns detected)
- **Per-project state**: Session files keyed by MD5 of CWD, stored in `~/.smart-claude/`
- **Immutable session updates**: `updateSession()` returns a new object; original is never mutated
- **5-second timeout**: Hook configured with timeout to never block the user's workflow
- **Fail-silent**: All errors caught at top level; hook exits 0 on any failure

### Rules system (src/rules.js)

Four categories of detection, each with its own severity:
- **Fillers** (low): "could you please", "kindly", "I want you to", etc.
- **Duplicate intents** (medium): "in detail" + "step by step", "explain" + "describe"
- **Preambles** (medium): "act as a senior engineer", "you are an AI"
- **Modifiers** (low): "very detailed", "extremely thorough"
- **Structure** (medium): long unstructured single-line prompts
- **Length** (high): prompts > 2000 chars

### Session patterns (src/session.js)

Tracked across prompts within a project:
- Growth trend: 3+ consecutive prompts increasing in token count
- Context overlap: >75% string similarity + size increase between consecutive prompts
- Refinement chains: >60% similarity between consecutive prompts
- Rolling history: last 5 prompts kept for trend analysis
