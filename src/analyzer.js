import { countTokens } from './tokenizer.js';
import { detectIssues, compressPrompt } from './rules.js';

export function analyzePrompt(prompt) {
  const tokens = countTokens(prompt);
  const issues = detectIssues(prompt);
  const optimized = compressPrompt(prompt);
  const optimizedTokens = countTokens(optimized);
  const savings = tokens - optimizedTokens;

  return {
    original: prompt,
    tokens,
    optimized,
    optimizedTokens,
    savings,
    savingsPercent: tokens > 0 ? Math.round((savings / tokens) * 100) : 0,
    issues,
  };
}
