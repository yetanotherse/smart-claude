#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const HOOK_SCRIPT = resolve(__dirname, '..', 'hook.js');
const SETTINGS_PATH = join(homedir(), '.claude', 'settings.json');
const HOOK_ID = 'smart-claude-token-optimizer';

function readSettings() {
  if (!existsSync(SETTINGS_PATH)) {
    return {};
  }
  return JSON.parse(readFileSync(SETTINGS_PATH, 'utf8'));
}

function writeSettings(settings) {
  mkdirSync(dirname(SETTINGS_PATH), { recursive: true });
  writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
}

function isInstalled(settings) {
  const hooks = settings.hooks?.UserPromptSubmit || [];
  return hooks.some((entry) =>
    entry.hooks?.some((h) => h.command?.includes(HOOK_ID) || h.command?.includes('smart-claude'))
  );
}

function buildHookEntry() {
  return {
    matcher: '*',
    hooks: [
      {
        type: 'command',
        command: `node "${HOOK_SCRIPT}" # ${HOOK_ID}`,
        timeout: 5,
      },
    ],
  };
}

const program = new Command();

program
  .name('smart-claude')
  .description('Token optimization hook for Claude Code')
  .version('2.0.0');

program
  .command('install')
  .description('Install the UserPromptSubmit hook into Claude Code settings')
  .action(() => {
    const settings = readSettings();

    if (isInstalled(settings)) {
      console.log('smart-claude hook is already installed.');
      return;
    }

    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.UserPromptSubmit) {
      settings.hooks.UserPromptSubmit = [];
    }

    settings.hooks.UserPromptSubmit.push(buildHookEntry());
    writeSettings(settings);

    console.log('smart-claude hook installed successfully.');
    console.log(`Hook script: ${HOOK_SCRIPT}`);
    console.log('Token optimization tips will appear after each prompt in Claude Code.');
  });

program
  .command('uninstall')
  .description('Remove the smart-claude hook from Claude Code settings')
  .action(() => {
    const settings = readSettings();

    if (!isInstalled(settings)) {
      console.log('smart-claude hook is not installed.');
      return;
    }

    settings.hooks.UserPromptSubmit = (settings.hooks.UserPromptSubmit || []).filter(
      (entry) => !entry.hooks?.some((h) => h.command?.includes(HOOK_ID) || h.command?.includes('smart-claude'))
    );

    if (settings.hooks.UserPromptSubmit.length === 0) {
      delete settings.hooks.UserPromptSubmit;
    }

    writeSettings(settings);
    console.log('smart-claude hook uninstalled.');
  });

program
  .command('status')
  .description('Show installation status and session stats')
  .action(async () => {
    const settings = readSettings();
    const installed = isInstalled(settings);

    console.log(`Hook installed: ${installed ? 'yes' : 'no'}`);
    console.log(`Hook script: ${HOOK_SCRIPT}`);
    console.log(`Settings file: ${SETTINGS_PATH}`);

    // Show session stats if available
    const { loadSession } = await import('../src/session.js');
    const session = loadSession();
    if (session.promptCount > 0) {
      console.log(`\nSession stats (this project):`);
      console.log(`  Prompts analyzed: ${session.promptCount}`);
      console.log(`  Total tokens: ${session.totalTokens}`);
      console.log(`  Avg tokens/prompt: ${session.avgPromptTokens}`);
      console.log(`  Context waste score: ${session.contextWasteScore}`);
      console.log(`  Refinement chains: ${session.refinementCount}`);
    }
  });

program
  .command('reset')
  .description('Reset session state for the current project')
  .action(async () => {
    const { resetSession } = await import('../src/session.js');
    resetSession();
    console.log('Session state reset.');
  });

program
  .command('analyze <prompt>')
  .description('Analyze a prompt without sending it to Claude')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (prompt, opts) => {
    const { analyzePrompt } = await import('../src/analyzer.js');
    const { formatForHook } = await import('../src/formatter.js');
    const { loadSession, updateSession } = await import('../src/session.js');

    const analysis = analyzePrompt(prompt);
    const session = loadSession();
    const updated = updateSession(session, prompt, analysis);

    const output = formatForHook(analysis, updated);
    if (output) {
      console.log(output);
    } else {
      console.log('No optimization issues found.');
    }

    if (opts.verbose) {
      console.log('\nRaw analysis:');
      console.log(JSON.stringify(analysis, null, 2));
    }
  });

program.parse();
