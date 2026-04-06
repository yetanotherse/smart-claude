import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatForHook } from '../src/formatter.js';

function makeAnalysis(overrides = {}) {
  return {
    original: 'test prompt',
    tokens: 10,
    optimized: 'test prompt',
    optimizedTokens: 10,
    savings: 0,
    savingsPercent: 0,
    issues: [],
    ...overrides,
  };
}

function makeSession(overrides = {}) {
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
    ...overrides,
  };
}

describe('formatForHook', () => {
  it('returns empty string when no issues found', () => {
    const output = formatForHook(makeAnalysis(), makeSession());
    assert.equal(output, '');
  });

  it('includes header when issues exist', () => {
    const analysis = makeAnalysis({
      issues: [{ type: 'filler', severity: 'low', message: 'Remove filler' }],
    });
    const output = formatForHook(analysis, makeSession());
    assert.ok(output.includes('Smart Claude'));
  });

  it('shows token savings when significant', () => {
    const analysis = makeAnalysis({
      tokens: 100,
      savings: 15,
      savingsPercent: 15,
      optimized: 'shorter',
      issues: [{ type: 'filler', severity: 'low', message: 'test' }],
    });
    const output = formatForHook(analysis, makeSession());
    assert.ok(output.includes('15%'));
    assert.ok(output.includes('Saveable'));
  });

  it('shows refinement warning', () => {
    const output = formatForHook(
      makeAnalysis({ issues: [{ type: 'filler', severity: 'low', message: 'x' }] }),
      makeSession({ lastRefinement: true })
    );
    assert.ok(output.includes('Iterative prompting'));
  });

  it('shows context warnings', () => {
    const output = formatForHook(
      makeAnalysis(),
      makeSession({ contextWarnings: ['Prompt size increasing'] })
    );
    assert.ok(output.includes('Prompt size increasing'));
  });

  it('shows session stats after 3+ prompts', () => {
    const output = formatForHook(
      makeAnalysis({ issues: [{ type: 'filler', severity: 'low', message: 'x' }] }),
      makeSession({ promptCount: 5, avgPromptTokens: 30, contextWasteScore: 2 })
    );
    assert.ok(output.includes('5 prompts'));
    assert.ok(output.includes('30 tokens/prompt'));
  });

  it('orders issues by severity (high first)', () => {
    const analysis = makeAnalysis({
      issues: [
        { type: 'filler', severity: 'low', message: 'low issue' },
        { type: 'length', severity: 'high', message: 'high issue' },
        { type: 'structure', severity: 'medium', message: 'medium issue' },
      ],
    });
    const output = formatForHook(analysis, makeSession());
    const highIdx = output.indexOf('high issue');
    const medIdx = output.indexOf('medium issue');
    const lowIdx = output.indexOf('low issue');
    assert.ok(highIdx < medIdx);
    assert.ok(medIdx < lowIdx);
  });
});
