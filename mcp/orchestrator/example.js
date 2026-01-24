#!/usr/bin/env node

/**
 * Work Distribution Example
 *
 * Demonstrates how to use the orchestrator system to distribute
 * features across multiple VPS workers for parallel execution.
 *
 * Usage:
 *   node mcp/orchestrator/example.js
 *
 * @module mcp/orchestrator/example
 */

import { WorkDistributor } from './work-distributor.js';
import { EventEmitter } from 'events';

/**
 * Mock MCP Server Pool (replace with real implementation)
 */
class MockMCPPool extends EventEmitter {
  constructor() {
    super();
    this.workers = new Map();
    this._initializeWorkers();
  }

  _initializeWorkers() {
    // Simulate 3 VPS workers
    this.workers.set('vps-1', {
      id: 'vps-1',
      capabilities: {
        memory: 2048,
        cpu: 4,
        agents: ['backend', 'frontend', 'tester']
      },
      async executeAgent(agent, task, options) {
        console.log(`[VPS-1] Executing ${agent} agent: ${task.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        return { success: true, executionId: `exec-${Date.now()}` };
      }
    });

    this.workers.set('vps-2', {
      id: 'vps-2',
      capabilities: {
        memory: 4096,
        cpu: 8,
        agents: ['backend', 'frontend', 'tester', 'reviewer']
      },
      async executeAgent(agent, task, options) {
        console.log(`[VPS-2] Executing ${agent} agent: ${task.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        return { success: true, executionId: `exec-${Date.now()}` };
      }
    });

    this.workers.set('vps-3', {
      id: 'vps-3',
      capabilities: {
        memory: 1024,
        cpu: 2,
        agents: ['reviewer', 'fixer', 'architect']
      },
      async executeAgent(agent, task, options) {
        console.log(`[VPS-3] Executing ${agent} agent: ${task.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        return { success: true, executionId: `exec-${Date.now()}` };
      }
    });

    this.size = this.workers.size;
  }

  async getAvailableWorkers() {
    return Array.from(this.workers.values());
  }

  async getWorker(workerId) {
    return this.workers.get(workerId);
  }
}

/**
 * Example: Simple parallel execution
 */
async function exampleSimpleParallel() {
  console.log('\n=== Example 1: Simple Parallel Execution ===\n');

  const pool = new MockMCPPool();
  const distributor = new WorkDistributor(pool);

  // Define features with no dependencies (all can run in parallel)
  const features = [
    {
      id: 'auth-login',
      agent: 'backend',
      priority: 'high',
      dependencies: [],
      metadata: {
        description: 'Implement user login endpoint',
        requirements: ['JWT tokens', 'Password hashing', 'Rate limiting']
      }
    },
    {
      id: 'auth-register',
      agent: 'backend',
      priority: 'high',
      dependencies: [],
      metadata: {
        description: 'Implement user registration endpoint'
      }
    },
    {
      id: 'profile-ui',
      agent: 'frontend',
      priority: 'medium',
      dependencies: [],
      metadata: {
        description: 'Create user profile page'
      }
    }
  ];

  // Track progress
  distributor.on('batch-started', (e) => {
    console.log(`📦 Batch ${e.batchNumber} started (${e.features} features)`);
  });

  distributor.on('feature-complete', (e) => {
    console.log(`✅ ${e.featureId} completed on ${e.workerId}`);
  });

  distributor.on('batch-complete', (e) => {
    console.log(`📦 Batch ${e.batchNumber} complete: ${e.successful} succeeded, ${e.failed} failed\n`);
  });

  const result = await distributor.distributeWork({ features });

  console.log('\nResults:', {
    total: result.total,
    successful: result.successful,
    failed: result.failed
  });

  distributor.destroy();
}

/**
 * Example: Features with dependencies
 */
async function exampleWithDependencies() {
  console.log('\n=== Example 2: Features with Dependencies ===\n');

  const pool = new MockMCPPool();
  const distributor = new WorkDistributor(pool);

  // Define features with dependencies
  const features = [
    {
      id: 'database-schema',
      agent: 'backend',
      priority: 'critical',
      dependencies: []
    },
    {
      id: 'auth-api',
      agent: 'backend',
      priority: 'high',
      dependencies: ['database-schema']
    },
    {
      id: 'user-api',
      agent: 'backend',
      priority: 'high',
      dependencies: ['database-schema']
    },
    {
      id: 'auth-ui',
      agent: 'frontend',
      priority: 'medium',
      dependencies: ['auth-api']
    },
    {
      id: 'user-ui',
      agent: 'frontend',
      priority: 'medium',
      dependencies: ['user-api']
    },
    {
      id: 'integration-tests',
      agent: 'tester',
      priority: 'low',
      dependencies: ['auth-ui', 'user-ui']
    }
  ];

  distributor.on('batch-started', (e) => {
    console.log(`\n📦 Batch ${e.batchNumber} started (${e.features} features)`);
  });

  distributor.on('feature-complete', (e) => {
    console.log(`   ✅ ${e.featureId} on ${e.workerId}`);
  });

  const result = await distributor.distributeWork({ features });

  console.log('\nExecution Summary:');
  const summary = distributor.getSummary();
  console.log('Progress:', summary.progress.percentComplete.toFixed(1) + '%');
  console.log('Duration:', summary.timeline.duration + 'ms');

  distributor.destroy();
}

/**
 * Example: Real-time progress monitoring
 */
async function exampleProgressMonitoring() {
  console.log('\n=== Example 3: Real-time Progress Monitoring ===\n');

  const pool = new MockMCPPool();
  const distributor = new WorkDistributor(pool);

  const features = [
    { id: 'feature-1', agent: 'backend', dependencies: [] },
    { id: 'feature-2', agent: 'backend', dependencies: [] },
    { id: 'feature-3', agent: 'backend', dependencies: ['feature-1'] },
    { id: 'feature-4', agent: 'backend', dependencies: ['feature-2'] },
    { id: 'feature-5', agent: 'backend', dependencies: ['feature-3', 'feature-4'] }
  ];

  // Monitor progress in real-time
  const progressInterval = setInterval(() => {
    const progress = distributor.getProgress();
    if (progress.overall.totalFeatures > 0) {
      console.log(`Progress: ${progress.overall.percentComplete.toFixed(1)}% ` +
        `(${progress.overall.completedFeatures}/${progress.overall.totalFeatures})`);
    }
  }, 500);

  await distributor.distributeWork({ features });

  clearInterval(progressInterval);

  const final = distributor.getProgress();
  console.log('\nFinal Status:');
  console.log('  Completed:', final.overall.completedFeatures);
  console.log('  Failed:', final.overall.failedFeatures);

  distributor.destroy();
}

/**
 * Example: Error handling and retries
 */
async function exampleErrorHandling() {
  console.log('\n=== Example 4: Error Handling ===\n');

  const pool = new MockMCPPool();
  const distributor = new WorkDistributor(pool, {
    maxRetries: 3,
    retryDelay: 1000
  });

  distributor.on('feature-retry', (e) => {
    console.log(`🔄 Retrying ${e.featureId} (attempt ${e.attempt}/${e.maxRetries})`);
  });

  distributor.on('feature-failed', (e) => {
    console.log(`❌ ${e.featureId} failed after ${e.retries} retries: ${e.error}`);
  });

  const features = [
    { id: 'reliable-feature', agent: 'backend', dependencies: [] },
    { id: 'another-feature', agent: 'backend', dependencies: [] }
  ];

  const result = await distributor.distributeWork({ features });

  console.log('\nResults:');
  console.log('  Successful:', result.successful);
  console.log('  Failed:', result.failed);
  console.log('  Retried:', result.retried);

  distributor.destroy();
}

/**
 * Example: Analyze dependency graph
 */
async function exampleDependencyAnalysis() {
  console.log('\n=== Example 5: Dependency Analysis ===\n');

  const pool = new MockMCPPool();
  const distributor = new WorkDistributor(pool);

  const features = [
    { id: 'A', agent: 'backend', dependencies: [] },
    { id: 'B', agent: 'backend', dependencies: [] },
    { id: 'C', agent: 'backend', dependencies: ['A'] },
    { id: 'D', agent: 'backend', dependencies: ['B'] },
    { id: 'E', agent: 'backend', dependencies: ['C', 'D'] }
  ];

  // Start distribution to build analysis
  const distributionPromise = distributor.distributeWork({ features });

  // Get analysis statistics
  const stats = distributor.analyzer.getStatistics();

  console.log('Dependency Graph Statistics:');
  console.log('  Total Features:', stats.totalFeatures);
  console.log('  Root Features:', stats.rootFeatures);
  console.log('  Leaf Features:', stats.leafFeatures);
  console.log('  Total Batches:', stats.totalBatches);
  console.log('  Max Parallelism:', stats.maxParallelism);
  console.log('  Avg Batch Size:', stats.avgBatchSize.toFixed(2));

  await distributionPromise;

  distributor.destroy();
}

/**
 * Main function - run all examples
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Work Distributor - Integration Examples              ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  try {
    await exampleSimpleParallel();
    await new Promise(resolve => setTimeout(resolve, 500));

    await exampleWithDependencies();
    await new Promise(resolve => setTimeout(resolve, 500));

    await exampleProgressMonitoring();
    await new Promise(resolve => setTimeout(resolve, 500));

    await exampleErrorHandling();
    await new Promise(resolve => setTimeout(resolve, 500));

    await exampleDependencyAnalysis();

    console.log('\n✨ All examples completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Example failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  exampleSimpleParallel,
  exampleWithDependencies,
  exampleProgressMonitoring,
  exampleErrorHandling,
  exampleDependencyAnalysis
};
