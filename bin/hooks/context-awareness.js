#!/usr/bin/env node

/**
 * Context Awareness Module
 *
 * Analyzes project state and provides intelligent suggestions for next actions.
 * Used by session-start and post-action hooks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read JSON file safely
 */
function readJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Check if file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Analyze project state and return context
 */
export function analyzeProjectState(projectRoot = process.cwd()) {
  const state = {
    hasProductSpec: false,
    hasArchitecture: false,
    hasState: false,
    hasCompletion: false,
    hasPendingDecisions: false,
    architectureValid: true,
    architectureIssues: [],
    currentPhase: 'idle',
    completionPercent: 0,
    totalFeatures: 0,
    completedFeatures: 0,
    pendingDecisionCount: 0,
    blockingIssues: [],
    suggestedActions: []
  };

  // Check product spec
  const productIndex = path.join(projectRoot, '.claude/product/index.md');
  const productDomains = path.join(projectRoot, '.claude/product/domains');
  state.hasProductSpec = fileExists(productIndex) || fileExists(productDomains);

  // Check architecture
  const architecturePath = path.join(projectRoot, '.agentful/architecture.json');
  if (fileExists(architecturePath)) {
    state.hasArchitecture = true;
    const arch = readJSON(architecturePath);

    if (arch) {
      // Validate architecture structure
      if (!arch.techStack || (!arch.agents && !arch.generatedAgents)) {
        state.architectureValid = false;
        state.architectureIssues.push('Missing techStack or agents fields');
      }

      // Check if architecture is stale (older than package.json)
      try {
        const packagePath = path.join(projectRoot, 'package.json');
        if (fileExists(packagePath)) {
          const archStat = fs.statSync(architecturePath);
          const pkgStat = fs.statSync(packagePath);

          if (pkgStat.mtime > archStat.mtime) {
            state.architectureValid = false;
            state.architectureIssues.push('Architecture older than package.json - may need regeneration');
          }
        }
      } catch (error) {
        // Ignore stat errors
      }
    } else {
      state.architectureValid = false;
      state.architectureIssues.push('Invalid JSON format');
    }
  }

  // Check state
  const statePath = path.join(projectRoot, '.agentful/state.json');
  if (fileExists(statePath)) {
    state.hasState = true;
    const stateData = readJSON(statePath);
    if (stateData) {
      state.currentPhase = stateData.current_phase || 'idle';
    }
  }

  // Check completion
  const completionPath = path.join(projectRoot, '.agentful/completion.json');
  if (fileExists(completionPath)) {
    state.hasCompletion = true;
    const completion = readJSON(completionPath);

    if (completion && completion.features) {
      const features = Object.values(completion.features);
      state.totalFeatures = features.length;
      state.completedFeatures = features.filter(f => f.completion >= 100).length;

      if (state.totalFeatures > 0) {
        state.completionPercent = Math.round((state.completedFeatures / state.totalFeatures) * 100);
      }
    }
  }

  // Check decisions
  const decisionsPath = path.join(projectRoot, '.agentful/decisions.json');
  if (fileExists(decisionsPath)) {
    const decisions = readJSON(decisionsPath);

    if (decisions && decisions.pending) {
      state.pendingDecisionCount = decisions.pending.length;
      state.hasPendingDecisions = state.pendingDecisionCount > 0;
    }
  }

  // Determine blocking issues
  if (!state.hasProductSpec) {
    state.blockingIssues.push('No product specification found');
  }

  if (state.hasArchitecture && !state.architectureValid) {
    state.blockingIssues.push('Architecture needs attention');
  }

  if (state.hasPendingDecisions) {
    state.blockingIssues.push(`${state.pendingDecisionCount} pending decision(s)`);
  }

  // Generate suggested actions
  state.suggestedActions = generateSuggestions(state);

  return state;
}

/**
 * Generate smart suggestions based on project state
 */
function generateSuggestions(state) {
  const suggestions = [];

  // First-time setup
  if (!state.hasProductSpec) {
    suggestions.push({
      priority: 'critical',
      action: 'Create product specification',
      command: 'Edit .claude/product/index.md',
      description: 'Define your product requirements'
    });
    return suggestions; // Block other suggestions until product spec exists
  }

  if (!state.hasArchitecture) {
    suggestions.push({
      priority: 'critical',
      action: 'Generate architecture',
      command: '/agentful-generate',
      description: 'Analyze tech stack and create specialized agents'
    });
    return suggestions;
  }

  // Architecture issues
  if (state.hasArchitecture && !state.architectureValid) {
    suggestions.push({
      priority: 'high',
      action: 'Fix architecture',
      command: '/agentful-generate',
      description: state.architectureIssues.join('; ')
    });
  }

  // Pending decisions block work
  if (state.hasPendingDecisions) {
    suggestions.push({
      priority: 'high',
      action: 'Answer pending decisions',
      command: '/agentful-decide',
      description: `${state.pendingDecisionCount} decision(s) blocking progress`
    });
  }

  // Phase-specific suggestions
  if (state.currentPhase === 'idle' || state.currentPhase === 'planning') {
    suggestions.push({
      priority: 'medium',
      action: 'Start development',
      command: '/agentful-start',
      description: 'Begin or resume structured development'
    });
  }

  if (state.currentPhase === 'implementation' || state.currentPhase === 'testing') {
    suggestions.push({
      priority: 'medium',
      action: 'Check progress',
      command: '/agentful-status',
      description: `Current: ${state.completionPercent}% complete (${state.completedFeatures}/${state.totalFeatures} features)`
    });
  }

  // Validation suggestion
  if (state.hasCompletion && state.completionPercent > 0) {
    suggestions.push({
      priority: 'low',
      action: 'Run quality checks',
      command: '/agentful-validate',
      description: 'Verify code quality and production readiness'
    });
  }

  // Product analysis
  suggestions.push({
    priority: 'low',
    action: 'Analyze product spec',
    command: '/agentful-product',
    description: 'Check for gaps and ambiguities'
  });

  return suggestions;
}

/**
 * Format suggestions for display
 */
export function formatSuggestions(suggestions, options = {}) {
  const { maxSuggestions = 5, includeNumbers = true } = options;

  if (suggestions.length === 0) {
    return '💡 All set! Type a command or ask what you need.';
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = suggestions.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Take top N
  const topSuggestions = sorted.slice(0, maxSuggestions);

  // Format output
  let output = '💡 Suggested next steps:\n';

  topSuggestions.forEach((suggestion, index) => {
    const number = includeNumbers ? `${index + 1}. ` : '   • ';
    const icon = suggestion.priority === 'critical' ? '🔴' :
                 suggestion.priority === 'high' ? '⚠️ ' : '';

    output += `   ${number}${icon}${suggestion.action} → ${suggestion.command}\n`;
    if (suggestion.description) {
      output += `      ${suggestion.description}\n`;
    }
  });

  return output.trim();
}

/**
 * Generate session start message
 */
export function generateSessionStartMessage(projectRoot = process.cwd()) {
  const state = analyzeProjectState(projectRoot);
  let message = '';

  // Status line
  if (state.hasCompletion && state.totalFeatures > 0) {
    message += `📊 Project Status: ${state.completionPercent}% complete (${state.completedFeatures}/${state.totalFeatures} features)\n`;
  } else if (state.hasArchitecture) {
    message += '📊 Project Status: Architecture ready, no active development\n';
  } else {
    message += '📊 Project Status: Initial setup\n';
  }

  // Blocking issues
  if (state.blockingIssues.length > 0) {
    state.blockingIssues.forEach(issue => {
      message += `⚠️  ${issue}\n`;
    });
    message += '\n';
  }

  // Current phase
  if (state.currentPhase !== 'idle') {
    message += `🔄 Current Phase: ${state.currentPhase}\n\n`;
  }

  // Suggestions
  message += formatSuggestions(state.suggestedActions, { maxSuggestions: 3 });

  return message;
}

/**
 * Generate post-action suggestions
 */
export function generatePostActionSuggestions(action, projectRoot = process.cwd()) {
  const state = analyzeProjectState(projectRoot);

  // Action-specific follow-ups
  const actionMap = {
    'agentful-generate': () => {
      if (state.completionPercent === 0) {
        return [{
          priority: 'high',
          action: 'Start development',
          command: '/agentful-start',
          description: 'Begin building features'
        }];
      }
      return [];
    },

    'agentful-start': () => [{
      priority: 'medium',
      action: 'Monitor progress',
      command: '/agentful-status',
      description: 'Check completion and active work'
    }],

    'agentful-decide': () => {
      if (state.pendingDecisionCount === 0) {
        return [{
          priority: 'high',
          action: 'Resume development',
          command: '/agentful-start',
          description: 'Continue with unblocked work'
        }];
      }
      return [];
    },

    'agentful-validate': () => [{
      priority: 'medium',
      action: 'Fix validation issues',
      command: 'Review output and address failures',
      description: 'Fixer agent can auto-resolve some issues'
    }]
  };

  const specificSuggestions = actionMap[action]?.() || [];
  const generalSuggestions = state.suggestedActions.filter(s =>
    s.command !== `/${action}`
  );

  return [...specificSuggestions, ...generalSuggestions];
}
