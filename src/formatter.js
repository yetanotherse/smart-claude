// Formats analysis results as markdown for Claude Code hook context output.

export function formatForHook(analysis, session) {
  const lines = [];

  const hasIssues = analysis.issues.length > 0;
  const hasWarnings = session.contextWarnings.length > 0;
  const hasSuggestions = session.contextSuggestions.length > 0;
  const hasRefinement = session.lastRefinement;
  const significantSavings = analysis.savingsPercent >= 5;

  // Nothing actionable — stay silent
  if (!hasIssues && !hasWarnings && !hasRefinement && !significantSavings) {
    return '';
  }

  lines.push('## Smart Claude: Token Optimization Tips');
  lines.push('');

  // Token summary line
  if (significantSavings) {
    lines.push(
      `**Tokens:** ${analysis.tokens} | **Saveable:** ~${analysis.savings} (${analysis.savingsPercent}%)`
    );
    lines.push('');
  }

  // Issues (grouped by severity)
  if (hasIssues) {
    const high = analysis.issues.filter((i) => i.severity === 'high');
    const medium = analysis.issues.filter((i) => i.severity === 'medium');
    const low = analysis.issues.filter((i) => i.severity === 'low');

    const ordered = [...high, ...medium, ...low];
    lines.push('**Suggestions:**');
    for (const issue of ordered) {
      const prefix = issue.severity === 'high' ? '[!]' : '-';
      lines.push(`${prefix} ${issue.message}`);
    }
    lines.push('');
  }

  // Refinement detection
  if (hasRefinement) {
    lines.push('**Iterative prompting detected:** Combine constraints upfront instead of refining over multiple prompts.');
    lines.push('');
  }

  // Context warnings
  if (hasWarnings) {
    lines.push('**Context warnings:**');
    for (const warning of session.contextWarnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  // Suggestions for fixing context waste
  if (hasSuggestions) {
    lines.push('**How to fix:**');
    for (const suggestion of session.contextSuggestions) {
      lines.push(`- ${suggestion}`);
    }
    lines.push('');
  }

  // Session trend (only after 3+ prompts)
  if (session.promptCount >= 3) {
    lines.push(
      `**Session:** ${session.promptCount} prompts | avg ${session.avgPromptTokens} tokens/prompt | waste score: ${session.contextWasteScore}`
    );
    lines.push('');
  }

  // Optimized prompt suggestion (only for significant savings)
  if (significantSavings && analysis.optimized !== analysis.original) {
    lines.push('**Optimized version:**');
    lines.push(`> ${analysis.optimized}`);
    lines.push('');
  }

  return lines.join('\n');
}
