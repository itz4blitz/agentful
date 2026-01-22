#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { PipelineEngine } from './engine.js';
import { AgentExecutor } from './executor.js';

/**
 * Pipeline CLI
 *
 * Command-line interface for managing pipeline execution
 */

const commands = {
  /**
   * Run a pipeline
   */
  async run(args) {
    const pipelineFile = args.pipeline || args.p;
    if (!pipelineFile) {
      console.error('Error: --pipeline (-p) is required');
      process.exit(1);
    }

    const contextFile = args.context || args.c;
    const context = contextFile
      ? JSON.parse(await fs.readFile(contextFile, 'utf-8'))
      : {};

    // Create agent executor
    const agentExecutor = new AgentExecutor({
      agentsDir: args.agentsDir || '.claude/agents',
      streamLogs: !args.quiet
    });

    // Create pipeline engine
    const engine = new PipelineEngine({
      maxConcurrentJobs: args.concurrency || 3,
      stateDir: args.stateDir || '.agentful/pipelines',
      agentExecutor: async (jobDef, jobContext, options) => {
        return await agentExecutor.execute(jobDef, jobContext, options);
      }
    });

    // Setup event handlers
    engine.on('pipeline:started', (event) => {
      console.log(`\n🚀 Pipeline started: ${event.pipeline}`);
      console.log(`   Run ID: ${event.runId}\n`);
    });

    engine.on('job:started', (event) => {
      console.log(`⏳ Job started: ${event.jobName} (attempt ${event.attempt})`);
    });

    engine.on('job:completed', (event) => {
      const duration = (event.duration / 1000).toFixed(1);
      console.log(`✅ Job completed: ${event.jobName} (${duration}s)\n`);
    });

    engine.on('job:failed', (event) => {
      console.error(`❌ Job failed: ${event.jobName}`);
      console.error(`   Error: ${event.error}\n`);
    });

    engine.on('job:progress', (event) => {
      if (args.verbose) {
        console.log(`   Progress: ${event.progress}%`);
      }
    });

    engine.on('job:log', (event) => {
      if (args.verbose) {
        console.log(`   ${event.message}`);
      }
    });

    engine.on('pipeline:completed', (event) => {
      const duration = (event.duration / 1000).toFixed(1);
      console.log(`\n✨ Pipeline completed successfully (${duration}s)`);
    });

    engine.on('pipeline:failed', (event) => {
      console.error(`\n💥 Pipeline failed: ${event.error}`);
    });

    // Start pipeline
    try {
      const runId = await engine.startPipeline(pipelineFile, context);

      // Wait for completion
      await waitForPipeline(engine, runId);

      const status = engine.getPipelineStatus(runId);
      if (status.status === 'completed') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  },

  /**
   * Get pipeline status
   */
  async status(args) {
    const runId = args.runId || args.r;
    if (!runId) {
      console.error('Error: --run-id (-r) is required');
      process.exit(1);
    }

    const engine = new PipelineEngine({
      stateDir: args.stateDir || '.agentful/pipelines'
    });

    const status = engine.getPipelineStatus(runId);
    if (!status) {
      console.error(`Pipeline not found: ${runId}`);
      process.exit(1);
    }

    console.log('\n📊 Pipeline Status\n');
    console.log(`Pipeline: ${status.pipeline}`);
    console.log(`Status: ${status.status}`);
    console.log(`Progress: ${status.progress}%`);
    console.log(`Started: ${status.startedAt}`);
    if (status.completedAt) {
      console.log(`Completed: ${status.completedAt}`);
    }

    console.log('\n📋 Jobs:\n');
    for (const job of status.jobs) {
      const icon = {
        pending: '⏸️ ',
        queued: '⏳',
        running: '⏳',
        completed: '✅',
        failed: '❌',
        skipped: '⏭️ '
      }[job.status];

      console.log(`${icon} ${job.name}`);
      console.log(`   Status: ${job.status}`);
      if (job.progress > 0) {
        console.log(`   Progress: ${job.progress}%`);
      }
      if (job.error) {
        console.log(`   Error: ${job.error}`);
      }
      console.log();
    }

    if (status.errors.length > 0) {
      console.log('\n⚠️  Errors:\n');
      for (const error of status.errors) {
        console.log(`- ${error.message}`);
      }
    }
  },

  /**
   * List pipeline runs
   */
  async list(args) {
    const stateDir = args.stateDir || '.agentful/pipelines';
    const runsDir = path.join(stateDir, 'runs');

    try {
      const files = await fs.readdir(runsDir);
      const runs = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const content = await fs.readFile(path.join(runsDir, file), 'utf-8');
        const state = JSON.parse(content);

        runs.push({
          runId: state.runId,
          pipeline: state.pipeline.name,
          status: state.status,
          startedAt: state.startedAt,
          completedAt: state.completedAt
        });
      }

      // Sort by start time (newest first)
      runs.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

      console.log('\n📋 Pipeline Runs\n');
      for (const run of runs) {
        const icon = {
          idle: '⏸️ ',
          running: '⏳',
          completed: '✅',
          failed: '❌',
          cancelled: '⏹️ '
        }[run.status];

        console.log(`${icon} ${run.pipeline}`);
        console.log(`   Run ID: ${run.runId}`);
        console.log(`   Status: ${run.status}`);
        console.log(`   Started: ${run.startedAt}`);
        if (run.completedAt) {
          console.log(`   Completed: ${run.completedAt}`);
        }
        console.log();
      }
    } catch (error) {
      console.error(`Error listing runs: ${error.message}`);
      process.exit(1);
    }
  },

  /**
   * Cancel a pipeline run
   */
  async cancel(args) {
    const runId = args.runId || args.r;
    if (!runId) {
      console.error('Error: --run-id (-r) is required');
      process.exit(1);
    }

    const engine = new PipelineEngine({
      stateDir: args.stateDir || '.agentful/pipelines'
    });

    const cancelled = await engine.cancelPipeline(runId);
    if (cancelled) {
      console.log(`✅ Pipeline cancelled: ${runId}`);
    } else {
      console.error(`❌ Pipeline not found: ${runId}`);
      process.exit(1);
    }
  },

  /**
   * Resume a pipeline run
   */
  async resume(args) {
    const runId = args.runId || args.r;
    if (!runId) {
      console.error('Error: --run-id (-r) is required');
      process.exit(1);
    }

    const engine = new PipelineEngine({
      stateDir: args.stateDir || '.agentful/pipelines'
    });

    const resumed = await engine.resumePipeline(runId);
    if (resumed) {
      console.log(`✅ Pipeline resumed: ${runId}`);
    } else {
      console.error(`❌ Cannot resume pipeline: ${runId}`);
      process.exit(1);
    }
  },

  /**
   * Validate pipeline definition
   */
  async validate(args) {
    const pipelineFile = args.pipeline || args.p;
    if (!pipelineFile) {
      console.error('Error: --pipeline (-p) is required');
      process.exit(1);
    }

    try {
      const engine = new PipelineEngine();
      const pipeline = await engine.loadPipeline(pipelineFile);

      console.log('✅ Pipeline definition is valid');
      console.log(`   Name: ${pipeline.name}`);
      console.log(`   Jobs: ${pipeline.jobs.length}`);
    } catch (error) {
      console.error(`❌ Pipeline validation failed: ${error.message}`);
      process.exit(1);
    }
  },

  /**
   * Show help
   */
  help() {
    console.log(`
agentful pipeline - Pipeline orchestration for AI agents

Usage:
  agentful pipeline <command> [options]

Commands:
  run         Run a pipeline
  status      Get pipeline status
  list        List pipeline runs
  cancel      Cancel a running pipeline
  resume      Resume an interrupted pipeline
  validate    Validate pipeline definition

Options:
  --pipeline, -p     Pipeline YAML file
  --context, -c      Context JSON file
  --run-id, -r       Pipeline run ID
  --concurrency      Max concurrent jobs (default: 3)
  --state-dir        State directory (default: .agentful/pipelines)
  --agents-dir       Agents directory (default: .claude/agents)
  --verbose, -v      Verbose output
  --quiet, -q        Quiet mode (no logs)

Examples:
  # Run a pipeline
  agentful pipeline run --pipeline examples/pipelines/feature-development.yml

  # Run with context
  agentful pipeline run -p pipeline.yml -c context.json

  # Check status
  agentful pipeline status --run-id feature-development-1234567890-abc

  # List all runs
  agentful pipeline list

  # Cancel a run
  agentful pipeline cancel --run-id feature-development-1234567890-abc

  # Validate pipeline
  agentful pipeline validate --pipeline pipeline.yml
`);
  }
};

/**
 * Helper: Wait for pipeline to complete
 */
async function waitForPipeline(engine, runId) {
  return new Promise((resolve) => {
    const check = () => {
      const status = engine.getPipelineStatus(runId);
      if (!status) {
        resolve();
        return;
      }

      if (
        status.status === 'completed' ||
        status.status === 'failed' ||
        status.status === 'cancelled'
      ) {
        resolve();
        return;
      }

      setTimeout(check, 1000);
    };

    check();
  });
}

/**
 * Parse command-line arguments
 */
function parseArgs(argv) {
  const args = {};
  let current = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      current = arg.substring(2);
      args[current] = true;
    } else if (arg.startsWith('-')) {
      current = arg.substring(1);
      args[current] = true;
    } else if (current) {
      args[current] = arg;
      current = null;
    } else {
      if (!args._command) {
        args._command = arg;
      }
    }
  }

  return args;
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._command || 'help';

  if (!commands[command]) {
    console.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }

  try {
    await commands[command](args);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (args.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default { commands, parseArgs };
