import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectIssues, compressPrompt } from '../src/rules.js';

describe('detectIssues', () => {
  it('detects filler phrases', () => {
    const issues = detectIssues('Could you please explain how hooks work?');
    const fillerIssues = issues.filter((i) => i.type === 'filler');
    assert.ok(fillerIssues.length > 0);
    assert.ok(fillerIssues.some((i) => i.message.includes('could you please')));
  });

  it('detects multiple fillers in one prompt', () => {
    const issues = detectIssues('Please can you kindly help me?');
    const fillerIssues = issues.filter((i) => i.type === 'filler');
    assert.ok(fillerIssues.length >= 2);
  });

  it('detects duplicate intents', () => {
    const issues = detectIssues('Explain in detail step by step how to set up a project');
    const dupes = issues.filter((i) => i.type === 'duplicate');
    assert.equal(dupes.length, 1);
    assert.ok(dupes[0].message.includes('in detail'));
    assert.ok(dupes[0].message.includes('step by step'));
  });

  it('detects unnecessary preambles', () => {
    const issues = detectIssues('Act as a senior engineer and review this code');
    const preambles = issues.filter((i) => i.type === 'preamble');
    assert.ok(preambles.length > 0);
  });

  it('detects redundant modifiers', () => {
    const issues = detectIssues('Make a very detailed analysis of this function');
    const modifiers = issues.filter((i) => i.type === 'modifier');
    assert.ok(modifiers.length > 0);
  });

  it('detects long unstructured prompts', () => {
    const longPrompt = 'a '.repeat(300);
    const issues = detectIssues(longPrompt);
    const structure = issues.filter((i) => i.type === 'structure');
    assert.ok(structure.length > 0);
  });

  it('does not flag structured long prompts', () => {
    const structured = 'Please do the following:\n- First thing\n- Second thing\n' + 'more text '.repeat(50);
    const issues = detectIssues(structured);
    const structure = issues.filter((i) => i.type === 'structure');
    assert.equal(structure.length, 0);
  });

  it('detects very long prompts', () => {
    const veryLong = 'word '.repeat(500);
    const issues = detectIssues(veryLong);
    const length = issues.filter((i) => i.type === 'length');
    assert.ok(length.length > 0);
  });

  it('returns empty for clean prompts', () => {
    const issues = detectIssues('Fix the bug in auth.js line 42');
    assert.equal(issues.length, 0);
  });
});

describe('compressPrompt', () => {
  it('removes filler phrases', () => {
    const result = compressPrompt('Could you please explain how hooks work?');
    assert.ok(!result.toLowerCase().includes('could you please'));
    assert.ok(result.includes('explain'));
  });

  it('removes unnecessary preambles', () => {
    const result = compressPrompt('Act as a senior engineer and review this code');
    assert.ok(!result.toLowerCase().includes('act as a senior engineer'));
    assert.ok(result.includes('review'));
  });

  it('removes redundant modifiers', () => {
    const result = compressPrompt('Make a very detailed report');
    assert.ok(!result.toLowerCase().includes('very detailed'));
  });

  it('collapses whitespace after removals', () => {
    const result = compressPrompt('Please kindly help me');
    assert.ok(!result.includes('  '));
  });

  it('preserves clean prompts unchanged', () => {
    const prompt = 'Fix the bug in auth.js line 42';
    assert.equal(compressPrompt(prompt), prompt);
  });
});
