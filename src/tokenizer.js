import { encode } from 'gpt-tokenizer';

// Note: Uses GPT tokenizer as an approximation. Claude's actual tokenizer
// produces similar counts for English text but may differ for code/special chars.
// This is sufficient for relative comparisons and trend detection.
export function countTokens(text) {
  if (!text) return 0;
  return encode(text).length;
}
