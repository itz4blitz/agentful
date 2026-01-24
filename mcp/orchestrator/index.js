/**
 * Orchestrator - Intelligent Work Distribution System
 *
 * Coordinates parallel development across distributed VPS workers by analyzing
 * dependencies, creating optimal execution plans, and tracking progress.
 *
 * @module mcp/orchestrator
 */

export { DependencyAnalyzer } from './dependency-analyzer.js';
export { ExecutionPlanner } from './execution-planner.js';
export { ProgressAggregator } from './progress-aggregator.js';
export { WorkDistributor } from './work-distributor.js';

/**
 * Quick Start Guide
 * =================
 *
 * 1. Create an MCP server pool:
 *    ```javascript
 *    const pool = new MCPServerPool();
 *    await pool.addWorker('vps-1', 'https://vps1.example.com');
 *    await pool.addWorker('vps-2', 'https://vps2.example.com');
 *    ```
 *
 * 2. Create a work distributor:
 *    ```javascript
 *    import { WorkDistributor } from '@itz4blitz/agentful/mcp/orchestrator';
 *
 *    const distributor = new WorkDistributor(pool);
 *    ```
 *
 * 3. Define your features:
 *    ```javascript
 *    const features = [
 *      {
 *        id: 'auth-login',
 *        agent: 'backend',
 *        priority: 'high',
 *        dependencies: [],
 *        metadata: {
 *          description: 'Implement login API',
 *          requirements: ['JWT', 'Rate limiting']
 *        }
 *      },
 *      {
 *        id: 'profile-ui',
 *        agent: 'frontend',
 *        priority: 'medium',
 *        dependencies: ['auth-login']
 *      }
 *    ];
 *    ```
 *
 * 4. Distribute and execute:
 *    ```javascript
 *    const result = await distributor.distributeWork({ features });
 *    console.log(`Completed: ${result.successful}/${result.total}`);
 *    ```
 *
 * 5. Monitor progress:
 *    ```javascript
 *    distributor.on('feature-complete', ({ featureId }) => {
 *      console.log(`✅ ${featureId} complete`);
 *    });
 *
 *    const progress = distributor.getProgress();
 *    console.log(`Progress: ${progress.overall.percentComplete}%`);
 *    ```
 *
 * Advanced Usage
 * ==============
 *
 * Dependency Analysis:
 * ```javascript
 * import { DependencyAnalyzer } from '@itz4blitz/agentful/mcp/orchestrator';
 *
 * const analyzer = new DependencyAnalyzer();
 * analyzer.addFeatures(features);
 *
 * const validation = analyzer.validate();
 * const { hasCycles } = analyzer.detectCycles();
 * const batches = analyzer.generateBatches();
 * const stats = analyzer.getStatistics();
 * ```
 *
 * Custom Execution Plans:
 * ```javascript
 * import { ExecutionPlanner } from '@itz4blitz/agentful/mcp/orchestrator';
 *
 * const planner = new ExecutionPlanner({
 *   maxConcurrentPerWorker: 2,
 *   resourceEstimates: {
 *     backend: { time: 300000, memory: 512, cpu: 1 }
 *   }
 * });
 *
 * const plan = planner.createExecutionPlan(batches, workers);
 * const optimized = planner.optimizePlan(plan, workers);
 * ```
 *
 * Progress Persistence:
 * ```javascript
 * import { ProgressAggregator } from '@itz4blitz/agentful/mcp/orchestrator';
 *
 * const aggregator = new ProgressAggregator({
 *   persistencePath: '.agentful/progress.json',
 *   autoSave: true,
 *   updateInterval: 5000
 * });
 *
 * aggregator.initialize(features, plan);
 * await aggregator.save();
 * await aggregator.load();
 * ```
 *
 * Events
 * ======
 *
 * WorkDistributor events:
 * - 'distribution-started' - Work distribution begins
 * - 'distribution-complete' - All work finished
 * - 'batch-started' - New batch begins execution
 * - 'batch-complete' - Batch finished
 * - 'feature-complete' - Single feature completed
 * - 'feature-failed' - Feature failed
 * - 'feature-retry' - Feature being retried
 * - 'phase' - Distribution phase change
 *
 * DependencyAnalyzer events:
 * - 'feature-added' - Feature added to graph
 * - 'validation-success' - Dependencies validated
 * - 'validation-failed' - Validation errors found
 * - 'cycles-detected' - Circular dependencies found
 *
 * ProgressAggregator events:
 * - 'initialized' - Aggregator initialized
 * - 'feature-updated' - Feature status changed
 * - 'saved' - Progress saved to disk
 * - 'loaded' - Progress loaded from disk
 */

export default {
  DependencyAnalyzer,
  ExecutionPlanner,
  ProgressAggregator,
  WorkDistributor
};
