/**
 * Dependency Analyzer
 *
 * Analyzes feature dependencies and builds a dependency graph for optimal
 * parallel execution planning. Performs topological sorting to determine
 * execution order while maximizing parallelization opportunities.
 *
 * @module mcp/orchestrator/dependency-analyzer
 */

import { EventEmitter } from 'events';

/**
 * DependencyAnalyzer - Analyzes and resolves feature dependencies
 *
 * Features:
 * - Dependency graph construction
 * - Cycle detection
 * - Topological sorting
 * - Parallel batch generation
 * - Dependency validation
 *
 * @extends EventEmitter
 */
export class DependencyAnalyzer extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, Feature>} */
    this.features = new Map();
    /** @type {Map<string, Set<string>>} */
    this.dependencyGraph = new Map();
    /** @type {Map<string, Set<string>>} */
    this.reverseDependencyGraph = new Map();
  }

  /**
   * Add a feature to the dependency graph
   *
   * @param {Object} feature - Feature definition
   * @param {string} feature.id - Unique feature ID
   * @param {string} feature.agent - Agent type (backend, frontend, etc.)
   * @param {string[]} [feature.dependencies=[]] - Array of feature IDs this depends on
   * @param {string} [feature.priority='medium'] - Priority level
   * @param {Object} [feature.metadata={}] - Additional metadata
   * @throws {Error} If feature already exists or is invalid
   */
  addFeature(feature) {
    if (!feature.id) {
      throw new Error('Feature must have an id');
    }

    if (this.features.has(feature.id)) {
      throw new Error(`Feature already exists: ${feature.id}`);
    }

    if (!feature.agent) {
      throw new Error(`Feature ${feature.id} must have an agent type`);
    }

    const normalizedFeature = {
      id: feature.id,
      agent: feature.agent,
      dependencies: feature.dependencies || [],
      priority: feature.priority || 'medium',
      metadata: feature.metadata || {}
    };

    this.features.set(feature.id, normalizedFeature);
    this.dependencyGraph.set(feature.id, new Set(normalizedFeature.dependencies));
    this.reverseDependencyGraph.set(feature.id, new Set());

    // Build reverse graph
    for (const depId of normalizedFeature.dependencies) {
      if (!this.reverseDependencyGraph.has(depId)) {
        this.reverseDependencyGraph.set(depId, new Set());
      }
      this.reverseDependencyGraph.get(depId).add(feature.id);
    }

    this.emit('feature-added', feature.id);
  }

  /**
   * Add multiple features at once
   *
   * @param {Object[]} features - Array of feature definitions
   * @returns {number} Number of features added
   */
  addFeatures(features) {
    for (const feature of features) {
      this.addFeature(feature);
    }
    return features.length;
  }

  /**
   * Validate all dependencies exist
   *
   * @returns {Object} Validation result
   * @returns {boolean} result.valid - Whether all dependencies are valid
   * @returns {string[]} result.errors - Array of error messages
   */
  validate() {
    const errors = [];

    for (const [featureId, deps] of this.dependencyGraph.entries()) {
      for (const depId of deps) {
        if (!this.features.has(depId)) {
          errors.push(`Feature "${featureId}" depends on unknown feature "${depId}"`);
        }
      }
    }

    const valid = errors.length === 0;
    if (valid) {
      this.emit('validation-success');
    } else {
      this.emit('validation-failed', errors);
    }

    return { valid, errors };
  }

  /**
   * Detect circular dependencies using DFS
   *
   * @returns {Object} Cycle detection result
   * @returns {boolean} result.hasCycles - Whether cycles exist
   * @returns {string[][]} result.cycles - Array of cycle paths
   */
  detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const dfs = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        cycles.push(cycle);
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const dependencies = this.dependencyGraph.get(nodeId) || new Set();
      for (const depId of dependencies) {
        dfs(depId, [...path]);
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const featureId of this.features.keys()) {
      if (!visited.has(featureId)) {
        dfs(featureId);
      }
    }

    const hasCycles = cycles.length > 0;
    if (hasCycles) {
      this.emit('cycles-detected', cycles);
    }

    return { hasCycles, cycles };
  }

  /**
   * Perform topological sort using Kahn's algorithm
   *
   * Returns features in order that respects dependencies.
   * Features with no dependencies come first.
   *
   * @returns {string[]} Sorted feature IDs
   * @throws {Error} If circular dependencies exist
   */
  topologicalSort() {
    // Validate first
    const validation = this.validate();
    if (!validation.valid) {
      throw new Error(`Dependency validation failed: ${validation.errors.join(', ')}`);
    }

    // Check for cycles
    const { hasCycles, cycles } = this.detectCycles();
    if (hasCycles) {
      throw new Error(`Circular dependencies detected: ${cycles.map(c => c.join(' -> ')).join('; ')}`);
    }

    // Kahn's algorithm
    const inDegree = new Map();
    const sorted = [];
    const queue = [];

    // Calculate in-degree for all nodes
    for (const featureId of this.features.keys()) {
      inDegree.set(featureId, this.dependencyGraph.get(featureId).size);
      if (inDegree.get(featureId) === 0) {
        queue.push(featureId);
      }
    }

    // Process nodes with in-degree 0
    while (queue.length > 0) {
      const current = queue.shift();
      sorted.push(current);

      // Reduce in-degree for dependent features
      const dependents = this.reverseDependencyGraph.get(current) || new Set();
      for (const depFeatureId of dependents) {
        const newDegree = inDegree.get(depFeatureId) - 1;
        inDegree.set(depFeatureId, newDegree);

        if (newDegree === 0) {
          queue.push(depFeatureId);
        }
      }
    }

    // If sorted length doesn't match features count, there's a cycle
    if (sorted.length !== this.features.size) {
      throw new Error('Failed to sort: circular dependency detected');
    }

    this.emit('topological-sort-complete', sorted);
    return sorted;
  }

  /**
   * Generate execution batches for parallel processing
   *
   * Groups features that can be executed in parallel.
   * Each batch contains features with no dependencies on each other.
   *
   * @returns {Object[][]} Array of batches, each batch is an array of feature objects
   */
  generateBatches() {
    const sorted = this.topologicalSort();
    const batches = [];
    const processed = new Set();

    while (processed.size < sorted.length) {
      const batch = [];

      for (const featureId of sorted) {
        if (processed.has(featureId)) continue;

        // Check if all dependencies are processed
        const deps = this.dependencyGraph.get(featureId);
        const allDepsProcessed = Array.from(deps).every(depId => processed.has(depId));

        if (allDepsProcessed) {
          batch.push(this.features.get(featureId));
          processed.add(featureId);
        }
      }

      if (batch.length > 0) {
        batches.push(batch);
      } else {
        // Safety: should never happen with valid topological sort
        break;
      }
    }

    this.emit('batches-generated', { count: batches.length, features: processed.size });
    return batches;
  }

  /**
   * Get all features that depend on a given feature
   *
   * @param {string} featureId - Feature ID
   * @returns {string[]} Array of dependent feature IDs
   */
  getDependents(featureId) {
    return Array.from(this.reverseDependencyGraph.get(featureId) || new Set());
  }

  /**
   * Get all features that a given feature depends on
   *
   * @param {string} featureId - Feature ID
   * @returns {string[]} Array of dependency feature IDs
   */
  getDependencies(featureId) {
    return Array.from(this.dependencyGraph.get(featureId) || new Set());
  }

  /**
   * Get features with no dependencies (root features)
   *
   * @returns {Object[]} Array of feature objects with no dependencies
   */
  getRootFeatures() {
    const roots = [];
    for (const [featureId, deps] of this.dependencyGraph.entries()) {
      if (deps.size === 0) {
        roots.push(this.features.get(featureId));
      }
    }
    return roots;
  }

  /**
   * Get features with no dependents (leaf features)
   *
   * @returns {Object[]} Array of feature objects with no dependents
   */
  getLeafFeatures() {
    const leaves = [];
    for (const [featureId, dependents] of this.reverseDependencyGraph.entries()) {
      if (dependents.size === 0) {
        leaves.push(this.features.get(featureId));
      }
    }
    return leaves;
  }

  /**
   * Get statistics about the dependency graph
   *
   * @returns {Object} Graph statistics
   */
  getStatistics() {
    const batches = this.generateBatches();

    return {
      totalFeatures: this.features.size,
      rootFeatures: this.getRootFeatures().length,
      leafFeatures: this.getLeafFeatures().length,
      totalBatches: batches.length,
      maxParallelism: Math.max(...batches.map(b => b.length)),
      avgBatchSize: batches.reduce((sum, b) => sum + b.length, 0) / batches.length,
      avgDependencies: Array.from(this.dependencyGraph.values())
        .reduce((sum, deps) => sum + deps.size, 0) / this.features.size
    };
  }

  /**
   * Reset the analyzer (clear all features and dependencies)
   */
  reset() {
    this.features.clear();
    this.dependencyGraph.clear();
    this.reverseDependencyGraph.clear();
    this.emit('reset');
  }

  /**
   * Export graph as JSON for visualization
   *
   * @returns {Object} Graph representation
   */
  toJSON() {
    return {
      features: Array.from(this.features.values()),
      dependencies: Array.from(this.dependencyGraph.entries()).map(([id, deps]) => ({
        id,
        dependencies: Array.from(deps)
      })),
      statistics: this.getStatistics()
    };
  }
}

export default DependencyAnalyzer;
