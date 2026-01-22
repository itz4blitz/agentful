import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { trackAgentMetrics } from '../../../bin/hooks/post-agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..', '..', '..');
const metricsFile = path.join(projectRoot, '.agentful', 'agent-metrics.json');

describe('post-agent hook', () => {
  beforeEach(() => {
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }
    const agentfulDir = path.join(projectRoot, '.agentful');
    if (!fs.existsSync(agentfulDir)) {
      fs.mkdirSync(agentfulDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(metricsFile)) {
      fs.unlinkSync(metricsFile);
    }
  });

  describe('environment variable handling', () => {
    it('should return success when agentName is not provided', () => {
      const result = trackAgentMetrics({ agentName: '' });
      expect(result.success).toBe(true);
    });

    it('should track agent when agentName is provided', () => {
      const result = trackAgentMetrics({ agentName: 'test-agent' });
      expect(result.success).toBe(true);
      expect(fs.existsSync(metricsFile)).toBe(true);
    });
  });

  describe('metrics file creation', () => {
    it('should create metrics file if it does not exist', () => {
      trackAgentMetrics({ agentName: 'backend' });
      expect(fs.existsSync(metricsFile)).toBe(true);
    });

    it('should initialize with correct structure', () => {
      trackAgentMetrics({ agentName: 'backend' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics).toHaveProperty('invocations');
      expect(metrics).toHaveProperty('last_invocation');
      expect(metrics).toHaveProperty('feature_hooks');
    });
  });

  describe('invocation tracking', () => {
    it('should increment invocation count', () => {
      trackAgentMetrics({ agentName: 'backend' });
      trackAgentMetrics({ agentName: 'backend' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(2);
    });

    it('should track multiple agents independently', () => {
      trackAgentMetrics({ agentName: 'backend' });
      trackAgentMetrics({ agentName: 'frontend' });
      trackAgentMetrics({ agentName: 'backend' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(2);
      expect(metrics.invocations.frontend).toBe(1);
    });

    it('should update last_invocation timestamp', () => {
      trackAgentMetrics({ agentName: 'backend', timestamp: '2024-01-01T00:00:00.000Z' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation).toHaveProperty('agent', 'backend');
      expect(metrics.last_invocation).toHaveProperty('timestamp');
    });
  });

  describe('feature and domain tracking', () => {
    it('should track feature context', () => {
      trackAgentMetrics({ agentName: 'backend', feature: 'login' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.feature).toBe('login');
    });

    it('should track domain context', () => {
      trackAgentMetrics({ agentName: 'backend', domain: 'auth', feature: 'login' });
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.last_invocation.domain).toBe('auth');
    });
  });

  describe('error handling', () => {
    it('should handle corrupted metrics file', () => {
      fs.writeFileSync(metricsFile, 'invalid json {{{');
      const result = trackAgentMetrics({ agentName: 'backend' });
      expect(result.success).toBe(true);
      const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      expect(metrics.invocations.backend).toBe(1);
    });
  });
});
