import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyAnalyzer } from '../../orchestrator/dependency-analyzer.js';

describe('DependencyAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
  });

  describe('Feature Management', () => {
    it('should add a single feature', () => {
      analyzer.addFeature({
        id: 'auth-login',
        agent: 'backend',
        dependencies: []
      });

      expect(analyzer.features.size).toBe(1);
      expect(analyzer.features.get('auth-login')).toBeDefined();
    });

    it('should add multiple features', () => {
      const features = [
        { id: 'auth-login', agent: 'backend', dependencies: [] },
        { id: 'auth-register', agent: 'backend', dependencies: [] },
        { id: 'profile-ui', agent: 'frontend', dependencies: ['auth-login'] }
      ];

      const count = analyzer.addFeatures(features);

      expect(count).toBe(3);
      expect(analyzer.features.size).toBe(3);
    });

    it('should throw on duplicate feature ID', () => {
      analyzer.addFeature({ id: 'auth', agent: 'backend' });

      expect(() => {
        analyzer.addFeature({ id: 'auth', agent: 'backend' });
      }).toThrow('Feature already exists: auth');
    });

    it('should throw on missing ID', () => {
      expect(() => {
        analyzer.addFeature({ agent: 'backend' });
      }).toThrow('Feature must have an id');
    });

    it('should throw on missing agent', () => {
      expect(() => {
        analyzer.addFeature({ id: 'test' });
      }).toThrow('Feature test must have an agent type');
    });

    it('should set default priority to medium', () => {
      analyzer.addFeature({ id: 'test', agent: 'backend' });

      const feature = analyzer.features.get('test');
      expect(feature.priority).toBe('medium');
    });

    it('should preserve custom priority', () => {
      analyzer.addFeature({
        id: 'test',
        agent: 'backend',
        priority: 'high'
      });

      const feature = analyzer.features.get('test');
      expect(feature.priority).toBe('high');
    });
  });

  describe('Dependency Validation', () => {
    it('should validate features with valid dependencies', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      const result = analyzer.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B'] });

      const result = analyzer.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('unknown feature "B"');
    });

    it('should detect multiple missing dependencies', () => {
      analyzer.addFeature({
        id: 'A',
        agent: 'backend',
        dependencies: ['B', 'C', 'D']
      });

      const result = analyzer.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect no cycles in linear dependency', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['B'] });

      const result = analyzer.detectCycles();

      expect(result.hasCycles).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should detect simple cycle (A -> B -> A)', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B'] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      const result = analyzer.detectCycles();

      expect(result.hasCycles).toBe(true);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('should detect complex cycle (A -> B -> C -> A)', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B'] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['C'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['A'] });

      const result = analyzer.detectCycles();

      expect(result.hasCycles).toBe(true);
    });

    it('should handle self-dependency as cycle', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['A'] });

      const result = analyzer.detectCycles();

      expect(result.hasCycles).toBe(true);
    });

    it('should detect no cycles in diamond dependency', () => {
      // A -> B, A -> C, B -> D, C -> D
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['D'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['D'] });
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B', 'C'] });

      const result = analyzer.detectCycles();

      expect(result.hasCycles).toBe(false);
    });
  });

  describe('Topological Sort', () => {
    it('should sort features with no dependencies first', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      const sorted = analyzer.topologicalSort();

      expect(sorted.indexOf('A')).toBeLessThan(sorted.indexOf('B'));
    });

    it('should throw on circular dependencies', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B'] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      expect(() => {
        analyzer.topologicalSort();
      }).toThrow('Circular dependencies detected');
    });

    it('should sort complex dependency graph', () => {
      // A -> C, B -> C, C -> D
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['D'] });
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['C'] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['C'] });

      const sorted = analyzer.topologicalSort();

      expect(sorted).toHaveLength(4);
      expect(sorted.indexOf('D')).toBe(0); // D has no deps
      expect(sorted.indexOf('C')).toBe(1); // C depends only on D
      // A and B can be in any order
      expect(sorted.indexOf('A')).toBeGreaterThan(sorted.indexOf('C'));
      expect(sorted.indexOf('B')).toBeGreaterThan(sorted.indexOf('C'));
    });
  });

  describe('Batch Generation', () => {
    it('should generate single batch for independent features', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: [] });

      const batches = analyzer.generateBatches();

      expect(batches).toHaveLength(1);
      expect(batches[0]).toHaveLength(3);
    });

    it('should generate multiple batches for linear dependencies', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['B'] });

      const batches = analyzer.generateBatches();

      expect(batches).toHaveLength(3);
      expect(batches[0]).toHaveLength(1);
      expect(batches[0][0].id).toBe('A');
      expect(batches[1][0].id).toBe('B');
      expect(batches[2][0].id).toBe('C');
    });

    it('should parallelize independent branches', () => {
      // A -> C, B -> D, C and D independent
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: ['B'] });

      const batches = analyzer.generateBatches();

      expect(batches).toHaveLength(2);
      expect(batches[0]).toHaveLength(2); // A and B in parallel
      expect(batches[1]).toHaveLength(2); // C and D in parallel
    });

    it('should handle diamond dependency correctly', () => {
      // A -> B, A -> C, B -> D, C -> D
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['D'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['D'] });
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B', 'C'] });

      const batches = analyzer.generateBatches();

      expect(batches).toHaveLength(3);
      expect(batches[0][0].id).toBe('D');
      expect(batches[1]).toHaveLength(2); // B and C in parallel
      expect(batches[2][0].id).toBe('A');
    });
  });

  describe('Dependency Queries', () => {
    beforeEach(() => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: ['B', 'C'] });
    });

    it('should get dependencies of a feature', () => {
      const deps = analyzer.getDependencies('D');

      expect(deps).toHaveLength(2);
      expect(deps).toContain('B');
      expect(deps).toContain('C');
    });

    it('should get dependents of a feature', () => {
      const dependents = analyzer.getDependents('A');

      expect(dependents).toHaveLength(2);
      expect(dependents).toContain('B');
      expect(dependents).toContain('C');
    });

    it('should get root features', () => {
      const roots = analyzer.getRootFeatures();

      expect(roots).toHaveLength(1);
      expect(roots[0].id).toBe('A');
    });

    it('should get leaf features', () => {
      const leaves = analyzer.getLeafFeatures();

      expect(leaves).toHaveLength(1);
      expect(leaves[0].id).toBe('D');
    });
  });

  describe('Statistics', () => {
    it('should calculate graph statistics', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'C', agent: 'backend', dependencies: ['A'] });
      analyzer.addFeature({ id: 'D', agent: 'backend', dependencies: ['B'] });
      analyzer.addFeature({ id: 'E', agent: 'backend', dependencies: ['C', 'D'] });

      const stats = analyzer.getStatistics();

      expect(stats.totalFeatures).toBe(5);
      expect(stats.rootFeatures).toBe(2); // A and B
      expect(stats.leafFeatures).toBe(1); // E
      expect(stats.totalBatches).toBe(3);
      expect(stats.maxParallelism).toBeGreaterThan(1);
    });
  });

  describe('Export and Reset', () => {
    it('should export to JSON', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      const json = analyzer.toJSON();

      expect(json.features).toHaveLength(2);
      expect(json.dependencies).toHaveLength(2);
      expect(json.statistics).toBeDefined();
    });

    it('should reset analyzer', () => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });
      analyzer.reset();

      expect(analyzer.features.size).toBe(0);
      expect(analyzer.dependencyGraph.size).toBe(0);
    });
  });

  describe('Event Emission', () => {
    it('should emit feature-added event', (done) => {
      analyzer.on('feature-added', (featureId) => {
        expect(featureId).toBe('test');
        done();
      });

      analyzer.addFeature({ id: 'test', agent: 'backend' });
    });

    it('should emit validation-success event', (done) => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: [] });

      analyzer.on('validation-success', () => {
        done();
      });

      analyzer.validate();
    });

    it('should emit cycles-detected event', (done) => {
      analyzer.addFeature({ id: 'A', agent: 'backend', dependencies: ['B'] });
      analyzer.addFeature({ id: 'B', agent: 'backend', dependencies: ['A'] });

      analyzer.on('cycles-detected', (cycles) => {
        expect(cycles.length).toBeGreaterThan(0);
        done();
      });

      analyzer.detectCycles();
    });
  });
});
