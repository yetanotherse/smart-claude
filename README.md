# smart-claude

Token optimization hook for [Claude Code](https://claude.ai/code). Analyzes your prompts in real-time and suggests ways to reduce token usage without losing effectiveness.

## What it does

smart-claude installs as a `UserPromptSubmit` hook in Claude Code. Every time you send a prompt, it:

1. Counts tokens (approximate, using GPT tokenizer)
2. Detects inefficiencies: filler phrases, duplicate intents, unnecessary preambles, redundant modifiers, poor structure
3. Tracks session patterns: context bloat, iterative refinement chains, growing prompt sizes
4. Outputs actionable suggestions as context that appears alongside Claude's response

When your prompt is clean, the hook stays silent.

## Install

```bash
npm install -g smart-claude
smart-claude install
```

This adds a `UserPromptSubmit` hook to your `~/.claude/settings.json`. The hook runs on every prompt with a 5-second timeout.

## Uninstall

```bash
smart-claude uninstall
npm uninstall -g smart-claude
```

## CLI Commands

```bash
smart-claude install          # Add hook to Claude Code settings
smart-claude uninstall        # Remove hook from Claude Code settings
smart-claude status           # Show installation status and session stats
smart-claude reset            # Reset session tracking for current project
smart-claude analyze "prompt" # Analyze a prompt without sending to Claude
```

## What it detects

| Category | Example | Suggestion |
|----------|---------|------------|
| Filler phrases | "Could you please..." | Direct instructions work equally well |
| Duplicate intent | "in detail step by step" | Pick one -- they mean the same thing |
| Unnecessary preambles | "Act as a senior engineer" | Claude Code already knows its role |
| Redundant modifiers | "very detailed" | Be specific about what you need instead |
| Poor structure | Long single-line prompts | Use bullet points for multi-part requests |
| Context bloat | Re-pasting previous context | Summarize or reference previous answers |
| Refinement chains | Similar consecutive prompts | Combine constraints upfront |

## Session tracking

smart-claude tracks per-project session state in `~/.smart-claude/`. It monitors:

- **Prompt growth trends** -- warns when prompts get progressively larger
- **Context overlap** -- detects when you're repeating context between prompts
- **Refinement chains** -- flags iterative prompt tweaking (>60% similarity)
- **Cumulative stats** -- total tokens, average per prompt, waste score

## How it works

The hook receives the prompt via stdin JSON from Claude Code's hook system. Analysis happens locally with no network calls. Output is injected as additional context that Claude can reference when responding.

```
User prompt → hook.js → analyze → format markdown → stdout → Claude sees tips
```

## Development

```bash
git clone <repo-url>
cd smart-claude
npm install
npm test
```

### Testing the hook manually

```bash
echo '{"prompt": "Could you please explain how closures work?"}' | node hook.js
```

## License

MIT
