import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { createHash } from 'node:crypto';
import stringSimilarity from 'string-similarity';

const STATE_DIR = join(homedir(), '.smart-claude');

function getStatePath() {
  const projectId = createHash('md5').update(process.cwd()).digest('hex').slice(0, 8);
  return join(STATE_DIR, `session-${projectId}.json`);
}

function createEmptySession() {
  return {
    totalTokens: 0,
    promptCount: 0,
    promptHistory: [],
    lastPrompt: null,
    avgPromptTokens: 0,
    contextWasteScore: 0,
    contextWarnings: [],
    contextSuggestions: [],
    refinementCount: 0,
    lastRefinement: false,
  };
}

export function loadSession() {
  const statePath = getStatePath();
  if (!existsSync(statePath)) {
    return createEmptySession();
  }
  try {
    const raw = readFileSync(statePath, 'utf8');
    const data = JSON.parse(raw);
    return { ...createEmptySession(), ...data };
  } catch {
    return createEmptySession();
  }
}

function saveSession(session) {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(getStatePath(), JSON.stringify(session, null, 2));
}

function detectContextWarnings(promptHistory, lastPrompt, prompt, tokens, avgTokens) {
  const warnings = [];

  // Growth trend: 3+ consecutive prompts getting larger
  if (promptHistory.length >= 2) {
    const recent = [...promptHistory.slice(-2), { tokens }];
    if (recent[2].tokens > recent[1].tokens && recent[1].tokens > recent[0].tokens) {
      warnings.push('Prompt size is steadily increasing -- possible context bloat');
    }
  }

  // High overlap with previous prompt
  if (lastPrompt) {
    const similarity = stringSimilarity.compareTwoStrings(lastPrompt, prompt);
    if (similarity > 0.75 && tokens > avgTokens) {
      warnings.push('High overlap with previous prompt + increased size -- repeated context detected');
    }
  }

  // Large prompt
  if (tokens > 300) {
    warnings.push('Large prompt (>300 tokens) -- consider summarizing context');
  }

  return warnings;
}

function generateSuggestions(warnings) {
  const suggestions = new Set();

  for (const warning of warnings) {
    if (warning.includes('Large prompt')) {
      suggestions.add('Summarize previous context instead of re-pasting it');
    }
    if (warning.includes('overlap')) {
      suggestions.add("Use 'Continue from previous response' instead of repeating context");
    }
    if (warning.includes('increasing')) {
      suggestions.add('Context growing over time -- refer to previous answers instead of pasting full history');
    }
  }

  return [...suggestions];
}

export function updateSession(session, prompt, analysis) {
  const newHistory = [...session.promptHistory, { prompt, tokens: analysis.tokens }].slice(-5);
  const totalTokens = session.totalTokens + analysis.tokens;
  const promptCount = session.promptCount + 1;
  const avgPromptTokens = Math.round(
    newHistory.reduce((sum, entry) => sum + entry.tokens, 0) / newHistory.length
  );

  // Detect refinement (similar consecutive prompts)
  let lastRefinement = false;
  let refinementCount = session.refinementCount;
  if (session.lastPrompt) {
    const similarity = stringSimilarity.compareTwoStrings(session.lastPrompt, prompt);
    if (similarity > 0.6) {
      lastRefinement = true;
      refinementCount += 1;
    }
  }

  const contextWarnings = detectContextWarnings(
    session.promptHistory,
    session.lastPrompt,
    prompt,
    analysis.tokens,
    session.avgPromptTokens
  );

  const wasteIncrement = contextWarnings.length > 0
    ? contextWarnings.reduce((sum, w) => sum + (w.includes('overlap') ? 2 : 1), 0)
    : 0;

  const contextSuggestions = generateSuggestions(contextWarnings);

  const updated = {
    totalTokens,
    promptCount,
    promptHistory: newHistory,
    lastPrompt: prompt,
    avgPromptTokens,
    contextWasteScore: session.contextWasteScore + wasteIncrement,
    contextWarnings,
    contextSuggestions,
    refinementCount,
    lastRefinement,
  };

  saveSession(updated);
  return updated;
}

export function resetSession() {
  const session = createEmptySession();
  saveSession(session);
  return session;
}
