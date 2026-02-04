/**
 * Preset configurations for agentful initialization
 *
 * SIMPLIFIED: Only two concepts
 * 1. "default" (or no preset) - Everything installed (recommended)
 * 2. "minimal" - Minimal setup for simple scripts/CLIs
 *
 * Tech stack is auto-detected on first run, irrelevant to installation.
 *
 * Each preset defines:
 * - agents: array of agent names to include
 * - skills: array of skill names to include
 * - hooks: array of hook identifiers to configure
 * - gates: array of quality gate identifiers
 */

export const presets = {
  default: {
    description: 'Complete agentful installation (recommended)',
    agents: ['orchestrator', 'architect', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'product-analyzer'],
    skills: ['product-tracking', 'validation', 'testing', 'conversation', 'product-planning', 'deployment', 'research'],
    hooks: ['session-start', 'health-check', 'block-random-docs', 'block-file-creation', 'product-spec-watcher', 'architect-drift-detector', 'analyze-trigger'],
    gates: ['types', 'tests', 'coverage', 'lint', 'security', 'dead-code']
  },

  minimal: {
    description: 'Minimal setup - orchestrator only, you create custom agents',
    agents: ['orchestrator'],
    skills: ['validation'],
    hooks: [],
    gates: ['types', 'tests']
  }
};

/**
 * Hook configurations mapping
 * Maps hook identifiers to actual hook configurations
 */
export const hookConfigurations = {
  'health-check': {
    event: 'SessionStart',
    config: {
      type: 'command',
      command: 'node bin/hooks/health-check.js',
      timeout: 5,
      description: 'Quick agentful health check'
    }
  },

  'block-random-docs': {
    event: 'PreToolUse',
    matcher: 'Write',
    config: {
      type: 'command',
      command: 'node bin/hooks/block-random-docs.js',
      blocking: true,
      description: 'Prevent creation of random markdown files'
    }
  },

  'block-file-creation': {
    event: 'PreToolUse',
    matcher: 'Write',
    config: {
      type: 'command',
      command: 'node bin/hooks/block-file-creation.js',
      blocking: true,
      description: 'Prevent creation of arbitrary JSON/TXT/LOG files'
    }
  },

  'typescript-validation': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'npx tsc --noEmit 2>&1 | head -5 || true',
      description: 'TypeScript validation after file changes'
    }
  },

  'notifications': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'osascript -e \'display notification "File updated: $FILE" with title "agentful"\' 2>/dev/null || true',
      description: 'Desktop notifications for file changes'
    }
  },

  'format-on-save': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'npx prettier --write "$FILE" 2>/dev/null || true',
      description: 'Auto-format files on save'
    }
  },

  'session-start': {
    event: 'SessionStart',
    config: {
      type: 'command',
      command: 'node bin/hooks/session-start.js',
      timeout: 3,
      description: 'Intelligent context awareness - shows project status and suggests next steps'
    }
  },

  'post-action-suggestions': {
    event: 'PostToolUse',
    matcher: 'SlashCommand',
    config: {
      type: 'command',
      command: 'node bin/hooks/post-action-suggestions.js',
      timeout: 3,
      description: 'Smart suggestions for what to do next after slash commands'
    }
  },

  'analyze-trigger': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'node bin/hooks/analyze-trigger.js',
      timeout: 3,
      description: 'Check if file changes warrant analysis'
    }
  },

  'architect-drift-detector': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'node bin/hooks/architect-drift-detector.js',
      timeout: 3,
      description: 'Detect when architect needs to re-analyze project'
    }
  },

  'product-spec-watcher': {
    event: 'PostToolUse',
    matcher: 'Write|Edit',
    config: {
      type: 'command',
      command: 'node bin/hooks/product-spec-watcher.js',
      timeout: 3,
      description: 'Watch for product spec changes and auto-trigger generation'
    }
  }
};

/**
 * Parse comma-separated CLI flag into array
 * @param {string} value - Comma-separated values
 * @returns {string[]}
 */
export function parseArrayFlag(value) {
  if (!value) return [];
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

/**
 * Merge preset with CLI flags (flags take precedence)
 * @param {Object} preset - Preset configuration
 * @param {Object} flags - CLI flags
 * @returns {Object} Merged configuration
 */
export function mergePresetWithFlags(preset, flags) {
  return {
    agents: flags.agents || preset.agents,
    skills: flags.skills || preset.skills,
    hooks: flags.hooks || preset.hooks,
    gates: flags.gates || preset.gates,
    techStack: flags.techStack || preset.techStack
  };
}

/**
 * Get preset by name
 * @param {string} presetName - Name of preset
 * @returns {Object|null} Preset configuration or null if not found
 */
export function getPreset(presetName) {
  return presets[presetName] || null;
}

/**
 * List all available presets
 * @returns {Object[]} Array of preset info
 */
export function listPresets() {
  return Object.entries(presets).map(([name, config]) => ({
    name,
    description: config.description,
    agents: config.agents.length,
    skills: config.skills.length,
    hooks: config.hooks.length,
    gates: config.gates.length
  }));
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateConfiguration(config) {
  const errors = [];
  const availableAgents = ['orchestrator', 'architect', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'product-analyzer'];
  const availableSkills = ['product-tracking', 'validation', 'testing', 'conversation', 'product-planning', 'deployment', 'research'];
  const availableHooks = Object.keys(hookConfigurations);

  // Always require orchestrator
  if (!config.agents || !config.agents.includes('orchestrator')) {
    errors.push('orchestrator agent is required and will be added automatically');
  }

  // Validate agents
  if (config.agents) {
    const invalidAgents = config.agents.filter(a => !availableAgents.includes(a));
    if (invalidAgents.length > 0) {
      errors.push(`Invalid agents: ${invalidAgents.join(', ')}`);
    }
  }

  // Validate skills
  if (config.skills) {
    const invalidSkills = config.skills.filter(s => !availableSkills.includes(s));
    if (invalidSkills.length > 0) {
      errors.push(`Invalid skills: ${invalidSkills.join(', ')}`);
    }
  }

  // Validate hooks
  if (config.hooks) {
    const invalidHooks = config.hooks.filter(h => !availableHooks.includes(h));
    if (invalidHooks.length > 0) {
      errors.push(`Invalid hooks: ${invalidHooks.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate settings.json hooks section from hook identifiers
 * @param {string[]} hookIds - Array of hook identifiers
 * @returns {Object} Settings.json hooks section
 */
export function generateHooksConfig(hookIds) {
  const hooks = {};

  for (const hookId of hookIds) {
    const hookConfig = hookConfigurations[hookId];
    if (!hookConfig) continue;

    const event = hookConfig.event;
    if (!hooks[event]) {
      hooks[event] = [];
    }

    const hookEntry = {
      hooks: [hookConfig.config]
    };

    // Add matcher if specified
    if (hookConfig.matcher) {
      hookEntry.matcher = hookConfig.matcher;
    }

    hooks[event].push(hookEntry);
  }

  return hooks;
}
