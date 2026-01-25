import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  analyzeProjectState,
  formatSuggestions,
  generateSessionStartMessage,
  generatePostActionSuggestions
} from '../../lib/context-awareness.js';

// Mock fs
vi.mock('fs');

/**
 * Context Awareness Unit Tests
 *
 * Tests for lib/context-awareness.js
 * Covers project state analysis, suggestion generation, and message formatting
 */

describe('Context Awareness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('analyzeProjectState', () => {
    it('should detect missing product spec', () => {
      fs.existsSync.mockReturnValue(false);

      const state = analyzeProjectState('/test/project');

      expect(state.hasProductSpec).toBe(false);
      expect(state.blockingIssues).toContain('No product specification found');
    });

    it('should detect product spec from index.md', () => {
      fs.existsSync.mockImplementation((p) => {
        return p.includes('product/index.md');
      });

      const state = analyzeProjectState('/test/project');

      expect(state.hasProductSpec).toBe(true);
    });

    it('should detect product spec from domains directory', () => {
      fs.existsSync.mockImplementation((p) => {
        return p.includes('product/domains');
      });

      const state = analyzeProjectState('/test/project');

      expect(state.hasProductSpec).toBe(true);
    });

    it('should detect valid architecture', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        techStack: { frontend: 'React', backend: 'Node' },
        agents: ['frontend', 'backend']
      }));

      const state = analyzeProjectState('/test/project');

      expect(state.hasArchitecture).toBe(true);
      expect(state.architectureValid).toBe(true);
    });

    it('should detect invalid architecture (missing fields)', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        techStack: { frontend: 'React' }
        // Missing agents field
      }));

      const state = analyzeProjectState('/test/project');

      expect(state.hasArchitecture).toBe(true);
      expect(state.architectureValid).toBe(false);
      expect(state.architectureIssues).toContain('Missing techStack or agents fields');
    });

    it('should detect stale architecture', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('package.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        techStack: { frontend: 'React' },
        agents: ['frontend']
      }));

      // Mock statSync to show architecture older than package.json
      fs.statSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return { mtime: new Date('2024-01-01') };
        }
        if (p.includes('package.json')) {
          return { mtime: new Date('2024-01-02') };
        }
      });

      const state = analyzeProjectState('/test/project');

      expect(state.architectureValid).toBe(false);
      expect(state.architectureIssues.some(i => i.includes('older than package.json'))).toBe(true);
    });

    it('should calculate completion percentage', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('completion.json')) return true;
        return false;
      });

      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return JSON.stringify({ techStack: {}, agents: [] });
        }
        if (p.includes('completion.json')) {
          return JSON.stringify({
            features: {
              'feature-1': { completion: 100 },
              'feature-2': { completion: 100 },
              'feature-3': { completion: 50 },
              'feature-4': { completion: 0 }
            }
          });
        }
      });

      const state = analyzeProjectState('/test/project');

      expect(state.totalFeatures).toBe(4);
      expect(state.completedFeatures).toBe(2);
      expect(state.completionPercent).toBe(50);
    });

    it('should detect pending decisions', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('decisions.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        pending: [
          { id: '1', question: 'Use SQL or NoSQL?' },
          { id: '2', question: 'Deploy to AWS or GCP?' }
        ]
      }));

      const state = analyzeProjectState('/test/project');

      expect(state.hasPendingDecisions).toBe(true);
      expect(state.pendingDecisionCount).toBe(2);
      expect(state.blockingIssues).toContain('2 pending decision(s)');
    });

    it('should detect current phase', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('state.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({
        current_phase: 'implementation'
      }));

      const state = analyzeProjectState('/test/project');

      expect(state.hasState).toBe(true);
      expect(state.currentPhase).toBe('implementation');
    });
  });

  describe('formatSuggestions', () => {
    it('should format suggestions with numbers', () => {
      const suggestions = [
        {
          priority: 'high',
          action: 'Fix architecture',
          command: '/agentful-generate',
          description: 'Architecture needs update'
        },
        {
          priority: 'medium',
          action: 'Start development',
          command: '/agentful-start',
          description: 'Begin building'
        }
      ];

      const formatted = formatSuggestions(suggestions);

      expect(formatted).toContain('1. ⚠️ Fix architecture → /agentful-generate');
      expect(formatted).toContain('2. Start development → /agentful-start');
      expect(formatted).toContain('Architecture needs update');
    });

    it('should limit suggestions to maxSuggestions', () => {
      const suggestions = [
        { priority: 'high', action: 'Action 1', command: '/cmd1' },
        { priority: 'medium', action: 'Action 2', command: '/cmd2' },
        { priority: 'low', action: 'Action 3', command: '/cmd3' },
        { priority: 'low', action: 'Action 4', command: '/cmd4' }
      ];

      const formatted = formatSuggestions(suggestions, { maxSuggestions: 2 });

      expect(formatted).toContain('Action 1');
      expect(formatted).toContain('Action 2');
      expect(formatted).not.toContain('Action 3');
      expect(formatted).not.toContain('Action 4');
    });

    it('should sort suggestions by priority', () => {
      const suggestions = [
        { priority: 'low', action: 'Low priority', command: '/low' },
        { priority: 'critical', action: 'Critical priority', command: '/critical' },
        { priority: 'medium', action: 'Medium priority', command: '/medium' },
        { priority: 'high', action: 'High priority', command: '/high' }
      ];

      const formatted = formatSuggestions(suggestions);

      const criticalIndex = formatted.indexOf('Critical priority');
      const highIndex = formatted.indexOf('High priority');
      const mediumIndex = formatted.indexOf('Medium priority');
      const lowIndex = formatted.indexOf('Low priority');

      expect(criticalIndex).toBeLessThan(highIndex);
      expect(highIndex).toBeLessThan(mediumIndex);
      expect(mediumIndex).toBeLessThan(lowIndex);
    });

    it('should handle empty suggestions', () => {
      const formatted = formatSuggestions([]);

      expect(formatted).toContain('All set!');
    });

    it('should show critical icon for critical priority', () => {
      const suggestions = [
        { priority: 'critical', action: 'Critical task', command: '/critical' }
      ];

      const formatted = formatSuggestions(suggestions);

      expect(formatted).toContain('🔴');
    });
  });

  describe('generateSessionStartMessage', () => {
    it('should show initial setup message for new project', () => {
      fs.existsSync.mockReturnValue(false);

      const message = generateSessionStartMessage('/test/project');

      expect(message).toContain('Initial setup');
      expect(message).toContain('Create product specification');
    });

    it('should show completion status for active project', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('completion.json')) return true;
        return false;
      });

      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return JSON.stringify({ techStack: {}, agents: [] });
        }
        if (p.includes('completion.json')) {
          return JSON.stringify({
            features: {
              'f1': { completion: 100 },
              'f2': { completion: 50 }
            }
          });
        }
      });

      const message = generateSessionStartMessage('/test/project');

      expect(message).toContain('50% complete');
      expect(message).toContain('1/2 features');
    });

    it('should show blocking issues prominently', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('decisions.json')) return true;
        return false;
      });

      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return JSON.stringify({ techStack: {} }); // Missing agents - invalid
        }
        if (p.includes('decisions.json')) {
          return JSON.stringify({
            pending: [{ id: '1', question: 'Test?' }]
          });
        }
      });

      const message = generateSessionStartMessage('/test/project');

      expect(message).toContain('⚠️');
      expect(message).toContain('Architecture needs attention');
      expect(message).toContain('1 pending decision');
    });

    it('should limit to 3 suggestions', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({ techStack: {}, agents: [] }));

      const message = generateSessionStartMessage('/test/project');

      // Count numbered suggestions (1., 2., 3.)
      const matches = message.match(/\d\.\s/g) || [];
      expect(matches.length).toBeLessThanOrEqual(3);
    });
  });

  describe('generatePostActionSuggestions', () => {
    it('should suggest starting development after generate', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('completion.json')) return true;
        return false;
      });

      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return JSON.stringify({ techStack: {}, agents: [] });
        }
        if (p.includes('completion.json')) {
          return JSON.stringify({ features: {} }); // 0% complete
        }
      });

      const suggestions = generatePostActionSuggestions('agentful-generate', '/test/project');

      expect(suggestions.some(s => s.command === '/agentful-start')).toBe(true);
    });

    it('should suggest monitoring after starting development', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({ techStack: {}, agents: [] }));

      const suggestions = generatePostActionSuggestions('agentful-start', '/test/project');

      expect(suggestions.some(s => s.command === '/agentful-status')).toBe(true);
    });

    it('should suggest resuming work after deciding', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        if (p.includes('decisions.json')) return true;
        return false;
      });

      fs.readFileSync.mockImplementation((p) => {
        if (p.includes('architecture.json')) {
          return JSON.stringify({ techStack: {}, agents: [] });
        }
        if (p.includes('decisions.json')) {
          return JSON.stringify({ pending: [] }); // No more pending
        }
      });

      const suggestions = generatePostActionSuggestions('agentful-decide', '/test/project');

      expect(suggestions.some(s => s.command === '/agentful-start')).toBe(true);
    });

    it('should not suggest current action', () => {
      fs.existsSync.mockImplementation((p) => {
        if (p.includes('product/index.md')) return true;
        if (p.includes('architecture.json')) return true;
        return false;
      });

      fs.readFileSync.mockReturnValue(JSON.stringify({ techStack: {}, agents: [] }));

      const suggestions = generatePostActionSuggestions('agentful-start', '/test/project');

      expect(suggestions.every(s => s.command !== '/agentful-start')).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete project lifecycle', () => {
      // Initial state: nothing exists
      fs.existsSync.mockReturnValue(false);
      let state1 = analyzeProjectState('/test');
      expect(state1.suggestedActions[0].action).toContain('product specification');

      // After creating product spec
      fs.existsSync.mockImplementation(p => p.includes('product/index.md'));
      fs.readFileSync.mockReturnValue('');
      let state2 = analyzeProjectState('/test');
      expect(state2.suggestedActions[0].action).toContain('architecture');

      // After generating architecture
      fs.existsSync.mockImplementation(p =>
        p.includes('product/index.md') || p.includes('architecture.json')
      );
      fs.readFileSync.mockReturnValue(JSON.stringify({ techStack: {}, agents: [] }));
      let state3 = analyzeProjectState('/test');
      expect(state3.suggestedActions.some(s => s.action.includes('development'))).toBe(true);
    });

    it('should handle error recovery gracefully', () => {
      fs.existsSync.mockImplementation(() => {
        throw new Error('Filesystem error');
      });

      const state = analyzeProjectState('/test/project');

      // Should not crash, should have default values
      expect(state).toBeDefined();
      expect(state.hasProductSpec).toBe(false);
      expect(state.suggestedActions).toBeDefined();
    });
  });
});
