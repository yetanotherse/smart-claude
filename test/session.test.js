import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { loadSession, updateSession, resetSession } from '../src/session.js';

describe('session', () => {
  beforeEach(() => {
    resetSession();
  });

  it('loads an empty session when no state exists', () => {
    const session = loadSession();
    assert.equal(session.totalTokens, 0);
    assert.equal(session.promptCount, 0);
    assert.deepEqual(session.promptHistory, []);
  });

  it('updateSession returns a new object (immutability)', () => {
    const session = loadSession();
    const analysis = { tokens: 10, savings: 0, savingsPercent: 0, issues: [] };
    const updated = updateSession(session, 'test prompt', analysis);

    assert.notEqual(session, updated);
    assert.equal(session.totalTokens, 0);
    assert.equal(updated.totalTokens, 10);
  });

  it('tracks prompt count and total tokens', () => {
    const session = loadSession();
    const analysis = { tokens: 25, savings: 0, savingsPercent: 0, issues: [] };
    const updated = updateSession(session, 'first prompt', analysis);

    assert.equal(updated.promptCount, 1);
    assert.equal(updated.totalTokens, 25);
  });

  it('detects refinement chains (similar consecutive prompts)', () => {
    let session = loadSession();
    const analysis = { tokens: 10, savings: 0, savingsPercent: 0, issues: [] };

    session = updateSession(session, 'Explain how JavaScript closures work', analysis);
    session = updateSession(session, 'Explain how JavaScript closures work in detail', analysis);

    assert.equal(session.lastRefinement, true);
    assert.ok(session.refinementCount > 0);
  });

  it('does not detect refinement for different prompts', () => {
    let session = loadSession();
    const analysis = { tokens: 10, savings: 0, savingsPercent: 0, issues: [] };

    session = updateSession(session, 'Explain closures', analysis);
    session = updateSession(session, 'Fix the bug in auth.js', analysis);

    assert.equal(session.lastRefinement, false);
  });

  it('keeps only last 5 prompts in history', () => {
    let session = loadSession();
    const analysis = { tokens: 10, savings: 0, savingsPercent: 0, issues: [] };

    for (let i = 0; i < 7; i++) {
      session = updateSession(session, `prompt ${i}`, analysis);
    }

    assert.equal(session.promptHistory.length, 5);
  });

  it('resets session state', () => {
    let session = loadSession();
    const analysis = { tokens: 10, savings: 0, savingsPercent: 0, issues: [] };
    session = updateSession(session, 'test', analysis);

    resetSession();
    const fresh = loadSession();
    assert.equal(fresh.totalTokens, 0);
    assert.equal(fresh.promptCount, 0);
  });
});
