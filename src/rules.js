// Filler phrases that add no value to Claude Code prompts.
// Ordered roughly by frequency in real-world prompts.
const FILLERS = [
  'could you please',
  'can you please',
  'please can you',
  'i want you to',
  'i need you to',
  'i would like you to',
  'would you mind',
  'it would be great if you could',
  'could you kindly',
  'i was wondering if you could',
  'if possible, could you',
  'do you think you could',
  'would it be possible to',
  'kindly',
  'please',
];

// Pairs of phrases that express the same intent — using both wastes tokens.
const DUPLICATE_INTENTS = [
  ['in detail', 'step by step'],
  ['summarize', 'in brief'],
  ['explain', 'describe'],
  ['thorough', 'comprehensive'],
  ['make sure', 'ensure'],
  ['fix', 'resolve'],
  ['check', 'verify'],
  ['create', 'generate'],
];

// Preambles that waste tokens in a Claude Code context where Claude
// already knows its role and capabilities.
const UNNECESSARY_PREAMBLES = [
  'you are an ai',
  'as a language model',
  'as an ai assistant',
  'act as a senior engineer',
  'act as a developer',
  'act as an expert',
  'you are a helpful assistant',
  'pretend you are',
  'i want you to act as',
  'imagine you are',
];

// Redundant modifiers that add no precision.
const REDUNDANT_MODIFIERS = [
  'very detailed',
  'extremely thorough',
  'absolutely make sure',
  'definitely ensure',
  'completely rewrite',
  'fully understand',
  'really important',
  'super critical',
];

export function detectIssues(prompt) {
  const issues = [];
  const lower = prompt.toLowerCase();

  // Filler phrases
  for (const filler of FILLERS) {
    if (lower.includes(filler)) {
      issues.push({
        type: 'filler',
        severity: 'low',
        message: `Remove filler phrase: "${filler}" -- direct instructions work equally well`,
      });
    }
  }

  // Duplicate intents
  for (const [a, b] of DUPLICATE_INTENTS) {
    if (lower.includes(a) && lower.includes(b)) {
      issues.push({
        type: 'duplicate',
        severity: 'medium',
        message: `"${a}" and "${b}" express similar intent -- pick one`,
      });
    }
  }

  // Unnecessary preambles
  for (const preamble of UNNECESSARY_PREAMBLES) {
    if (lower.includes(preamble)) {
      issues.push({
        type: 'preamble',
        severity: 'medium',
        message: `Remove "${preamble}" -- Claude Code already knows its role`,
      });
    }
  }

  // Redundant modifiers
  for (const modifier of REDUNDANT_MODIFIERS) {
    if (lower.includes(modifier)) {
      issues.push({
        type: 'modifier',
        severity: 'low',
        message: `"${modifier}" is redundant -- be specific about what you need instead`,
      });
    }
  }

  // Long unstructured prompt
  if (prompt.length > 500 && !prompt.includes('\n') && !prompt.includes('- ')) {
    issues.push({
      type: 'structure',
      severity: 'medium',
      message: 'Long single-line prompt -- use bullet points or line breaks for multi-part requests',
    });
  }

  // Very long prompt
  if (prompt.length > 2000) {
    issues.push({
      type: 'length',
      severity: 'high',
      message: 'Very long prompt (>2000 chars) -- consider breaking into smaller requests or summarizing context',
    });
  }

  return issues;
}

export function compressPrompt(prompt) {
  let compressed = prompt;

  // Remove fillers (case-insensitive, word-boundary aware)
  for (const filler of FILLERS) {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    compressed = compressed.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }

  // Remove unnecessary preambles
  for (const preamble of UNNECESSARY_PREAMBLES) {
    const escaped = preamble.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    compressed = compressed.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }

  // Remove redundant modifiers
  for (const modifier of REDUNDANT_MODIFIERS) {
    const escaped = modifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    compressed = compressed.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }

  // For duplicate intents, keep the first, remove the second
  for (const [, b] of DUPLICATE_INTENTS) {
    const escaped = b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    compressed = compressed.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  }

  // Collapse whitespace
  return compressed.replace(/\s+/g, ' ').trim();
}
