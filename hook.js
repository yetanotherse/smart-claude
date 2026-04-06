#!/usr/bin/env node

// Claude Code UserPromptSubmit hook.
// Reads the prompt from stdin JSON, analyzes it for token optimization
// opportunities, and outputs markdown suggestions to stdout.

import { readFileSync } from 'node:fs';
import { analyzePrompt } from './src/analyzer.js';
import { loadSession, updateSession } from './src/session.js';
import { formatForHook } from './src/formatter.js';

try {
  const raw = readFileSync(0, 'utf8');
  const input = JSON.parse(raw);
  const prompt = input.prompt || '';

  // Skip short prompts and slash commands
  if (!prompt || prompt.length < 15 || prompt.startsWith('/')) {
    process.exit(0);
  }

  const analysis = analyzePrompt(prompt);
  const session = loadSession();
  const updated = updateSession(session, prompt, analysis);

  const output = formatForHook(analysis, updated);
  if (output) {
    process.stdout.write(output);
  }
} catch {
  // Hooks must never break the user's workflow — fail silently
  process.exit(0);
}
