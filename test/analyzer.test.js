import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzePrompt } from '../src/analyzer.js';

describe('analyzePrompt', () => {
  it('returns token count for a prompt', () => {
    const result = analyzePrompt('Explain how JavaScript closures work');
    assert.ok(result.tokens > 0);
  });

  it('calculates savings when fillers are present', () => {
    const result = analyzePrompt('Could you please explain how closures work?');
    assert.ok(result.savings > 0);
    assert.ok(result.savingsPercent > 0);
  });

  it('returns zero savings for clean prompts', () => {
    const result = analyzePrompt('Fix the bug in auth.js');
    assert.equal(result.savings, 0);
    assert.equal(result.savingsPercent, 0);
  });

  it('includes detected issues', () => {
    const result = analyzePrompt('Please kindly explain in detail step by step');
    assert.ok(result.issues.length > 0);
  });

  it('includes the optimized prompt', () => {
    const result = analyzePrompt('Could you please fix the bug?');
    assert.ok(result.optimized.length < result.original.length);
    assert.ok(result.optimized.includes('fix'));
  });

  it('handles empty prompt', () => {
    const result = analyzePrompt('');
    assert.equal(result.tokens, 0);
    assert.equal(result.savings, 0);
  });
});
