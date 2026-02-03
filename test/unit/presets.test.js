import { describe, it, expect } from 'vitest';
import {
  presets,
  hookConfigurations,
  parseArrayFlag,
  mergePresetWithFlags,
  getPreset,
  listPresets,
  validateConfiguration,
  generateHooksConfig
} from '../../lib/presets.js';

/**
 * Presets System Unit Tests
 *
 * Tests for preset configurations and preset management
 * Covers preset loading, validation, merging, and hook generation
 */

describe('presets', () => {
  it('should have default preset', () => {
    expect(presets.default).toBeDefined();
    expect(presets.default.description).toBeTruthy();
    expect(Array.isArray(presets.default.agents)).toBe(true);
    expect(Array.isArray(presets.default.skills)).toBe(true);
  });

  it('should have minimal preset', () => {
    expect(presets.minimal).toBeDefined();
    expect(presets.minimal.description).toBeTruthy();
    expect(Array.isArray(presets.minimal.agents)).toBe(true);
    expect(Array.isArray(presets.minimal.skills)).toBe(true);
  });

  it('default preset should include orchestrator', () => {
    expect(presets.default.agents).toContain('orchestrator');
  });

  it('minimal preset should include orchestrator', () => {
    expect(presets.minimal.agents).toContain('orchestrator');
  });

  it('default preset should have comprehensive agent list', () => {
    const agents = presets.default.agents;
    expect(agents).toContain('orchestrator');
    expect(agents).toContain('architect');
    expect(agents).toContain('backend');
    expect(agents).toContain('frontend');
    expect(agents).toContain('tester');
    expect(agents).toContain('reviewer');
    expect(agents).toContain('fixer');
    expect(agents).toContain('product-analyzer');
  });

  it('minimal preset should have limited agent list', () => {
    const agents = presets.minimal.agents;
    expect(agents).toContain('orchestrator');
    expect(agents.length).toBeLessThan(presets.default.agents.length);
  });

  it('default preset should have quality gates', () => {
    expect(Array.isArray(presets.default.gates)).toBe(true);
    expect(presets.default.gates).toContain('types');
    expect(presets.default.gates).toContain('tests');
    expect(presets.default.gates).toContain('coverage');
    expect(presets.default.gates).toContain('lint');
    expect(presets.default.gates).toContain('security');
    expect(presets.default.gates).toContain('dead-code');
  });
});

describe('hookConfigurations', () => {
  it('should have health-check hook', () => {
    expect(hookConfigurations['health-check']).toBeDefined();
    expect(hookConfigurations['health-check'].event).toBe('SessionStart');
    expect(hookConfigurations['health-check'].config).toBeDefined();
  });

  it('should have typescript-validation hook', () => {
    expect(hookConfigurations['typescript-validation']).toBeDefined();
    expect(hookConfigurations['typescript-validation'].event).toBe('PostToolUse');
  });

  it('should have notifications hook', () => {
    expect(hookConfigurations['notifications']).toBeDefined();
  });

  it('should have format-on-save hook', () => {
    expect(hookConfigurations['format-on-save']).toBeDefined();
  });

  it('all hooks should have event and config', () => {
    Object.entries(hookConfigurations).forEach(([name, hook]) => {
      expect(hook.event, `${name} should have event`).toBeTruthy();
      expect(hook.config, `${name} should have config`).toBeDefined();
    });
  });
});

describe('parseArrayFlag', () => {
  it('should parse comma-separated values', () => {
    const result = parseArrayFlag('a,b,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should trim whitespace', () => {
    const result = parseArrayFlag('a, b , c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should handle empty string', () => {
    const result = parseArrayFlag('');
    expect(result).toEqual([]);
  });

  it('should handle null/undefined', () => {
    expect(parseArrayFlag(null)).toEqual([]);
    expect(parseArrayFlag(undefined)).toEqual([]);
  });

  it('should filter empty values', () => {
    const result = parseArrayFlag('a,,b,  ,c');
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('should handle single value', () => {
    const result = parseArrayFlag('single');
    expect(result).toEqual(['single']);
  });
});

describe('mergePresetWithFlags', () => {
  it('should use preset values when flags not provided', () => {
    const preset = {
      agents: ['orchestrator', 'backend'],
      skills: ['validation'],
      hooks: ['health-check'],
      gates: ['types', 'tests']
    };
    const flags = {};

    const result = mergePresetWithFlags(preset, flags);
    expect(result).toEqual(preset);
  });

  it('should override preset with flags', () => {
    const preset = {
      agents: ['orchestrator', 'backend'],
      skills: ['validation'],
      hooks: [],
      gates: []
    };
    const flags = {
      agents: ['orchestrator', 'frontend'],
      skills: ['testing']
    };

    const result = mergePresetWithFlags(preset, flags);
    expect(result.agents).toEqual(['orchestrator', 'frontend']);
    expect(result.skills).toEqual(['testing']);
  });

  it('should merge partial flags', () => {
    const preset = {
      agents: ['orchestrator'],
      skills: ['validation'],
      hooks: [],
      gates: []
    };
    const flags = {
      agents: ['orchestrator', 'backend']
    };

    const result = mergePresetWithFlags(preset, flags);
    expect(result.agents).toEqual(['orchestrator', 'backend']);
    expect(result.skills).toEqual(['validation']);
  });
});

describe('getPreset', () => {
  it('should return preset by name', () => {
    const preset = getPreset('default');
    expect(preset).toBe(presets.default);
  });

  it('should return null for non-existent preset', () => {
    const preset = getPreset('nonexistent');
    expect(preset).toBeNull();
  });

  it('should return minimal preset', () => {
    const preset = getPreset('minimal');
    expect(preset).toBe(presets.minimal);
  });
});

describe('listPresets', () => {
  it('should return array of preset info', () => {
    const list = listPresets();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('should include preset names', () => {
    const list = listPresets();
    const names = list.map(p => p.name);
    expect(names).toContain('default');
    expect(names).toContain('minimal');
  });

  it('should include descriptions', () => {
    const list = listPresets();
    list.forEach(preset => {
      expect(preset.description).toBeTruthy();
    });
  });

  it('should include counts', () => {
    const list = listPresets();
    list.forEach(preset => {
      expect(typeof preset.agents).toBe('number');
      expect(typeof preset.skills).toBe('number');
      expect(typeof preset.hooks).toBe('number');
      expect(typeof preset.gates).toBe('number');
    });
  });
});

describe('validateConfiguration', () => {
  it('should accept valid configuration', () => {
    const config = {
      agents: ['orchestrator', 'backend'],
      skills: ['validation'],
      hooks: ['health-check'],
      gates: ['types']
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn if orchestrator is missing', () => {
    const config = {
      agents: ['backend'],
      skills: [],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('orchestrator');
  });

  it('should reject invalid agents', () => {
    const config = {
      agents: ['orchestrator', 'invalid-agent'],
      skills: [],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid-agent'))).toBe(true);
  });

  it('should reject invalid skills', () => {
    const config = {
      agents: ['orchestrator'],
      skills: ['invalid-skill'],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid-skill'))).toBe(true);
  });

  it('should reject invalid hooks', () => {
    const config = {
      agents: ['orchestrator'],
      skills: [],
      hooks: ['invalid-hook'],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('invalid-hook'))).toBe(true);
  });

  it('should accept all valid agents', () => {
    const config = {
      agents: ['orchestrator', 'architect', 'backend', 'frontend', 'tester', 'reviewer', 'fixer', 'product-analyzer'],
      skills: [],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(true);
  });

  it('should accept all valid skills', () => {
    const config = {
      agents: ['orchestrator'],
      skills: ['product-tracking', 'validation', 'testing', 'conversation', 'product-planning', 'deployment'],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(true);
  });

  it('should accept research skill (regression test)', () => {
    // Regression test: research skill was in default preset but missing from availableSkills
    const config = {
      agents: ['orchestrator'],
      skills: ['research'],
      hooks: [],
      gates: []
    };

    const result = validateConfiguration(config);
    expect(result.valid).toBe(true);
    expect(result.errors).not.toContain(expect.stringContaining('Invalid skills'));
  });

  it('default preset skills should all be valid', () => {
    // Ensure all skills in the default preset pass validation
    const config = {
      agents: presets.default.agents,
      skills: presets.default.skills,
      hooks: presets.default.hooks,
      gates: presets.default.gates
    };

    const result = validateConfiguration(config);
    const skillErrors = result.errors.filter(e => e.includes('Invalid skills'));
    expect(skillErrors).toHaveLength(0);
  });
});

describe('generateHooksConfig', () => {
  it('should generate empty config for no hooks', () => {
    const config = generateHooksConfig([]);
    expect(config).toEqual({});
  });

  it('should generate config for single hook', () => {
    const config = generateHooksConfig(['health-check']);
    expect(config.SessionStart).toBeDefined();
    expect(Array.isArray(config.SessionStart)).toBe(true);
    expect(config.SessionStart.length).toBeGreaterThan(0);
  });

  it('should group hooks by event', () => {
    const config = generateHooksConfig(['typescript-validation', 'format-on-save']);
    expect(config.PostToolUse).toBeDefined();
    expect(Array.isArray(config.PostToolUse)).toBe(true);
  });

  it('should include hook configuration', () => {
    const config = generateHooksConfig(['health-check']);
    const sessionStartHook = config.SessionStart[0];
    expect(sessionStartHook.hooks).toBeDefined();
    expect(Array.isArray(sessionStartHook.hooks)).toBe(true);
    expect(sessionStartHook.hooks[0].type).toBe('command');
  });

  it('should include matcher when specified', () => {
    const config = generateHooksConfig(['typescript-validation']);
    const postToolUseHook = config.PostToolUse[0];
    expect(postToolUseHook.matcher).toBeDefined();
    expect(postToolUseHook.matcher).toBe('Write|Edit');
  });

  it('should handle multiple hooks for same event', () => {
    const config = generateHooksConfig(['typescript-validation', 'notifications', 'format-on-save']);
    expect(config.PostToolUse).toBeDefined();
    // Should have multiple hooks under PostToolUse
    expect(config.PostToolUse.length).toBeGreaterThan(0);
  });

  it('should skip invalid hook identifiers', () => {
    const config = generateHooksConfig(['health-check', 'invalid-hook']);
    expect(config.SessionStart).toBeDefined();
    expect(Object.keys(config).length).toBeGreaterThan(0);
  });
});
