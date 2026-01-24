#!/usr/bin/env node

/**
 * agentful CLI - Thin wrapper for template initialization and status
 *
 * Smart analysis and generation happens in Claude Code using:
 * - /agentful-generate command (analyzes codebase & generates agents)
 * - /agentful-start command (begins structured development)
 *
 * REQUIREMENTS:
 * - Node.js 22.0.0 or higher (native fetch() support)
 * - This script uses the native fetch() API (no external dependencies)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initProject, isInitialized } from '../lib/init.js';
import {
  getPreset,
  listPresets,
  parseArrayFlag,
  mergePresetWithFlags,
  validateConfiguration
} from '../lib/presets.js';
import pipelineCLI from '../lib/pipeline/cli.js';
import {
  GitHubActionsAdapter,
  GitLabCIAdapter,
  JenkinsAdapter
} from '../lib/pipeline/integrations.js';
import { PipelineEngine } from '../lib/pipeline/engine.js';
import { AgentExecutor } from '../lib/pipeline/executor.js';
import {
  buildCIPrompt,
  generateWorkflow,
  writeWorkflowFile,
  listAvailableAgents
} from '../lib/ci/index.js';
import { startServerFromCLI } from '../lib/server/index.js';
import {
  addRemote,
  removeRemote,
  listRemotes,
  executeRemoteAgent,
  getRemoteExecutionStatus,
  listRemoteExecutions,
  listRemoteAgents,
  checkRemoteHealth,
  pollExecution
} from '../lib/remote/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from centralized config
const VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../version.json'), 'utf-8')).version;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function showBanner() {
  // ASCII art: AGENTFUL
  console.log('');
  log(colors.cyan, '   █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗██╗   ██╗██╗     ');
  log(colors.cyan, '  ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██║   ██║██║     ');
  log(colors.cyan, '  ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   █████╗  ██║   ██║██║     ');
  log(colors.cyan, '  ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██║   ██║██║     ');
  log(colors.cyan, '  ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ██║     ╚██████╔╝███████╗');
  log(colors.cyan, '  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝      ╚═════╝ ╚══════╝');
  console.log('');
  log(colors.dim, `                   v${VERSION}                             `);
  console.log('');
}

function showHelp() {
  showBanner();
  console.log('USAGE:');
  console.log(`  ${colors.bright}agentful${colors.reset} ${colors.green}<command>${colors.reset} ${colors.dim}[options]${colors.reset}`);
  console.log('');
  console.log('COMMANDS:');
  console.log(`  ${colors.green}init${colors.reset}         Install agentful (all components by default)`);
  console.log(`  ${colors.green}status${colors.reset}       Show agentful status and generated files`);
  console.log(`  ${colors.green}presets${colors.reset}      Show installation options`);
  console.log(`  ${colors.green}deploy${colors.reset}       Deploy pipeline to CI/CD platform`);
  console.log(`  ${colors.green}trigger${colors.reset}      Execute an agent with a task`);
  console.log(`  ${colors.green}pipeline${colors.reset}     Run and manage pipeline workflows`);
  console.log(`  ${colors.green}ci${colors.reset}           Generate prompts for claude-code-action`);
  console.log(`  ${colors.green}serve${colors.reset}        Start remote execution server`);
  console.log(`  ${colors.green}remote${colors.reset}       Configure and execute agents on remote servers`);
  console.log(`  ${colors.green}mcp${colors.reset}          Start MCP (Model Context Protocol) server`);
  console.log(`  ${colors.green}help${colors.reset}         Show this help message`);
  console.log(`  ${colors.green}--version${colors.reset}    Show version`);
  console.log('');
  console.log('INIT OPTIONS (optional):');
  console.log(`  ${colors.yellow}--preset=minimal${colors.reset}       Minimal setup (orchestrator + backend only)`);
  console.log(`  ${colors.yellow}--config=<url|id>${colors.reset}       Use a shareable configuration`);
  console.log(`  ${colors.yellow}--agents=<list>${colors.reset}         Custom agents (comma-separated)`);
  console.log(`  ${colors.yellow}--skills=<list>${colors.reset}         Custom skills (comma-separated)`);
  console.log(`  ${colors.yellow}--hooks=<list>${colors.reset}          Custom hooks (comma-separated)`);
  console.log(`  ${colors.yellow}--gates=<list>${colors.reset}          Custom quality gates (comma-separated)`);
  console.log('');
  console.log('EXAMPLES:');
  console.log(`  ${colors.dim}# Install agentful (all components - recommended)${colors.reset}`);
  console.log(`  ${colors.bright}agentful init${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Minimal setup (for simple scripts/CLIs)${colors.reset}`);
  console.log(`  ${colors.bright}agentful init --preset=minimal${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Deploy pipeline to GitHub Actions${colors.reset}`);
  console.log(`  ${colors.bright}agentful deploy --to github-actions --pipeline pipeline.yml${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Quick agent execution${colors.reset}`);
  console.log(`  ${colors.bright}agentful trigger backend "Implement user authentication"${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Run a pipeline${colors.reset}`);
  console.log(`  ${colors.bright}agentful pipeline run --pipeline pipeline.yml${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Generate CI prompt for claude-code-action${colors.reset}`);
  console.log(`  ${colors.bright}agentful ci backend "Review API changes"${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Generate workflow file for GitHub Actions${colors.reset}`);
  console.log(`  ${colors.bright}agentful ci --generate-workflow --platform github${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Start remote execution server (Tailscale mode)${colors.reset}`);
  console.log(`  ${colors.bright}agentful serve${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Start server with HMAC authentication${colors.reset}`);
  console.log(`  ${colors.bright}agentful serve --auth=hmac --secret=your-secret-key --https --cert=cert.pem --key=key.pem${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Configure remote server${colors.reset}`);
  console.log(`  ${colors.bright}agentful remote add prod http://my-server:3737${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Execute agent on remote${colors.reset}`);
  console.log(`  ${colors.bright}agentful remote exec backend "Fix memory leak" --remote=prod${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Start MCP server (for Claude Code, Kiro, Aider)${colors.reset}`);
  console.log(`  ${colors.bright}agentful mcp${colors.reset}`);
  console.log('');
  console.log('AFTER INIT:');
  console.log(`  1. ${colors.bright}Run claude${colors.reset} to start Claude Code`);
  console.log(`  2. ${colors.bright}Type /agentful-generate${colors.reset} to analyze codebase & generate agents`);
  console.log('');
  console.log('CLAUDE CODE COMMANDS:');
  console.log(`  ${colors.cyan}/agentful-generate${colors.reset}  - Analyze codebase & generate specialized agents`);
  console.log(`  ${colors.cyan}/agentful-start${colors.reset}     - Begin structured product development`);
  console.log(`  ${colors.cyan}/agentful-status${colors.reset}    - Check progress and completion percentage`);
  console.log(`  ${colors.cyan}/agentful-validate${colors.reset}  - Run quality gates (tests, lint, security)`);
  console.log(`  ${colors.cyan}/agentful-decide${colors.reset}    - Answer pending decisions`);
  console.log(`  ${colors.cyan}/agentful-product${colors.reset}   - Analyze product specification`);
  console.log(`  ${colors.cyan}/agentful-analyze${colors.reset}   - Validate agentful configuration`);
  console.log(`  ${colors.cyan}/agentful${colors.reset}           - Natural language conversation`);
  console.log('');
}

function showVersion() {
  console.log(`agentful v${VERSION}`);
}

function showPresets() {
  showBanner();
  log(colors.bright, 'Agentful Installation Options:');
  console.log('');

  log(colors.cyan, 'DEFAULT (Recommended)');
  log(colors.dim, '  Install all components - agentful works best with everything enabled');
  log(colors.dim, '  Command: agentful init');
  log(colors.dim, '  Includes: 8 agents, 6 skills, all hooks, all gates');
  console.log('');

  log(colors.cyan, 'MINIMAL');
  log(colors.dim, '  Minimal setup for simple scripts/CLIs');
  log(colors.dim, '  Command: agentful init --preset=minimal');
  log(colors.dim, '  Includes: 2 agents (orchestrator, backend), 1 skill (validation)');
  console.log('');

  log(colors.cyan, 'CUSTOM');
  log(colors.dim, '  Specify exactly what you want');
  log(colors.dim, '  Command: agentful init --agents=x,y,z --skills=a,b');
  log(colors.dim, '  Includes: Your choice of agents, skills, hooks, gates');
  console.log('');

  log(colors.bright, 'Philosophy:');
  log(colors.dim, '  - Tech stack is auto-detected (TypeScript, Python, etc.)');
  log(colors.dim, '  - Default to power - get everything, remove what you don\'t need');
  log(colors.dim, '  - One product: "agentful" - not multiple flavors');
  console.log('');
}

/**
 * Parse CLI flags from arguments
 * @param {string[]} args - CLI arguments
 * @returns {Object} Parsed flags
 */
function parseFlags(args) {
  const flags = {};

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      if (value) {
        flags[key] = value;
      } else {
        flags[key] = true;
      }
    }
  }

  return flags;
}

function checkGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let content = '';

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const agentfulIgnore = '# agentful runtime state\n.agentful/\n';

  if (!content.includes('.agentful/')) {
    fs.appendFileSync(gitignorePath, agentfulIgnore);
    log(colors.dim, 'Added .agentful/ to .gitignore');
  }
}

/**
 * Fetch configuration from shareable URL or ID
 * @param {string} configParam - URL or ID
 * @returns {Promise<Object|null>}
 */
async function fetchShareableConfig(configParam) {
  try {
    // Determine if it's a full URL or just an ID
    let apiUrl;
    if (configParam.startsWith('http://') || configParam.startsWith('https://')) {
      // Extract ID from URL
      const match = configParam.match(/\/c\/([a-f0-9]{8})$/i);
      if (!match) {
        throw new Error('Invalid config URL format. Expected: https://agentful.app/c/{id}');
      }
      const id = match[1];
      apiUrl = `https://agentful.app/api/get-config/${id}`;
    } else if (/^[a-f0-9]{8}$/i.test(configParam)) {
      // It's just the ID
      apiUrl = `https://agentful.app/api/get-config/${configParam}`;
    } else {
      throw new Error('Invalid config parameter. Provide either a full URL or an 8-character ID.');
    }

    log(colors.dim, `Fetching configuration from ${apiUrl}...`);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Configuration not found. The config may have expired or the ID is invalid.');
      }
      if (response.status === 410) {
        throw new Error('Configuration has expired (1 year TTL).');
      }
      throw new Error(`Failed to fetch config: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.config;
  } catch (error) {
    log(colors.red, `Error fetching shareable config: ${error.message}`);
    return null;
  }
}

async function init(args) {
  showBanner();

  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

  // Parse flags
  const flags = parseFlags(args);

  // Build configuration from preset and/or flags
  let config = null;

  // Check for shareable config first
  if (flags.config) {
    config = await fetchShareableConfig(flags.config);
    if (!config) {
      log(colors.red, 'Failed to load shareable configuration.');
      process.exit(1);
    }
    log(colors.green, 'Loaded shareable configuration successfully!');
    console.log('');
  } else {
    // Default to "default" preset if no flags provided
    let presetConfig = null;
    const hasCustomFlags = flags.agents || flags.skills || flags.hooks || flags.gates;

    if (flags.preset) {
      // User explicitly specified a preset
      presetConfig = getPreset(flags.preset);
      if (!presetConfig) {
        log(colors.red, `Unknown preset: ${flags.preset}`);
        console.log('');
        log(colors.dim, 'Available presets:');
        listPresets().forEach(p => log(colors.dim, `  - ${p.name}`));
        console.log('');
        log(colors.dim, 'Run: agentful presets');
        process.exit(1);
      }
      log(colors.dim, `Using preset: ${flags.preset}`);
    } else if (!hasCustomFlags) {
      // No preset and no custom flags = use default preset
      presetConfig = getPreset('default');
      log(colors.dim, 'Installing agentful (all components)');
    }

    // Parse individual flags
    const flagConfig = {
      agents: flags.agents ? parseArrayFlag(flags.agents) : null,
      skills: flags.skills ? parseArrayFlag(flags.skills) : null,
      hooks: flags.hooks ? parseArrayFlag(flags.hooks) : null,
      gates: flags.gates ? parseArrayFlag(flags.gates) : null
    };

    // Merge preset with flags (flags override preset)
    if (presetConfig) {
      config = mergePresetWithFlags(presetConfig, flagConfig);
    } else {
      // Custom configuration with no preset
      config = {
        agents: flagConfig.agents || ['orchestrator'],
        skills: flagConfig.skills || [],
        hooks: flagConfig.hooks || [],
        gates: flagConfig.gates || []
      };
    }

    // Validate configuration
    const validation = validateConfiguration(config);
    if (!validation.valid) {
      log(colors.yellow, 'Configuration warnings:');
      validation.errors.forEach(err => log(colors.yellow, `  - ${err}`));
      console.log('');
    }

    // Show what will be installed
    log(colors.dim, 'Configuration:');
    log(colors.dim, `  Agents: ${config.agents.join(', ')}`);
    log(colors.dim, `  Skills: ${config.skills.join(', ') || 'none'}`);
    log(colors.dim, `  Hooks: ${config.hooks.join(', ') || 'none'}`);
    log(colors.dim, `  Gates: ${config.gates.join(', ') || 'none'}`);
    console.log('');
  }

  // Check if already initialized
  if (await isInitialized(targetDir)) {
    log(colors.yellow, 'agentful is already initialized in this directory!');
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Overwrite? (y/N) ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      log(colors.dim, 'Aborted.');
      process.exit(0);
    }

    // Remove existing files
    log(colors.dim, 'Removing existing agentful files...');
    if (fs.existsSync(claudeDir)) {
      fs.rmSync(claudeDir, { recursive: true, force: true });
    }
    const agentfulDir = path.join(targetDir, '.agentful');
    if (fs.existsSync(agentfulDir)) {
      fs.rmSync(agentfulDir, { recursive: true, force: true });
    }
  }

  // Initialize using lib/init.js
  log(colors.dim, config ? 'Installing selected components...' : 'Copying templates...');
  try {
    const result = await initProject(targetDir, config);

    console.log('');
    log(colors.green, 'Initialized agentful successfully!');
    console.log('');
    log(colors.dim, 'Created files:');
    result.files.forEach(file => {
      log(colors.green, `  ${file}`);
    });
    console.log('');
  } catch (error) {
    log(colors.red, `Failed to initialize: ${error.message}`);
    process.exit(1);
  }

  // Update .gitignore
  checkGitignore();

  // Show next steps
  console.log('');
  log(colors.bright, 'Next Steps:');
  console.log('');
  log(colors.cyan, '  1. Run: claude');
  if (config && config.agents.length <= 3) {
    log(colors.cyan, '  2. Start building (agents are pre-selected)');
  } else {
    log(colors.cyan, '  2. Type: /agentful-generate');
  }
  console.log('');
  if (!config) {
    log(colors.dim, 'This will analyze your codebase and generate:');
    log(colors.dim, '  - Specialized agents for your tech stack');
    log(colors.dim, '  - Domain-specific agents (auth, billing, etc.)');
    log(colors.dim, '  - Skills for frameworks you use');
    console.log('');
  }
  log(colors.dim, 'Optional: Edit CLAUDE.md and .claude/product/index.md first to customize.');
  console.log('');
}

function showStatus() {
  const targetDir = process.cwd();
  const agentfulDir = path.join(targetDir, '.agentful');

  if (!fs.existsSync(agentfulDir)) {
    log(colors.red, 'agentful not initialized in this directory!');
    log(colors.dim, 'Run: npx @itz4blitz/agentful init');
    process.exit(1);
  }

  showBanner();
  log(colors.bright, 'Agentful Status:');
  console.log('');

  // Helper to read JSON safely
  const readJSON = (filepath) => {
    try {
      return fs.existsSync(filepath) ? JSON.parse(fs.readFileSync(filepath, 'utf-8')) : null;
    } catch {
      return null;
    }
  };

  // Read state files
  const state = readJSON(path.join(agentfulDir, 'state.json'));
  const completion = readJSON(path.join(agentfulDir, 'completion.json'));
  const decisions = readJSON(path.join(agentfulDir, 'decisions.json'));

  // Display state
  if (state) {
    log(colors.green, 'State:');
    log(colors.dim, `  Initialized: ${state.initialized || 'N/A'}`);
    const agentCount = state.agents?.length || 0;
    const skillCount = state.skills?.length || 0;
    log(colors.dim, `  Agents: ${agentCount} ${agentCount === 0 ? '(run /agentful-generate)' : ''}`);
    log(colors.dim, `  Skills: ${skillCount} ${skillCount === 0 ? '(run /agentful-generate)' : ''}`);
    console.log('');
  }

  // Display completion
  if (completion) {
    const agentComp = Object.keys(completion.agents || {}).length;
    const skillComp = Object.keys(completion.skills || {}).length;
    if (agentComp > 0 || skillComp > 0) {
      log(colors.green, `Completions: ${agentComp} agents, ${skillComp} skills`);
      console.log('');
    }
  }

  // Display decisions
  if (decisions?.decisions?.length > 0) {
    log(colors.yellow, `Decisions: ${decisions.decisions.length} pending`);
    console.log('');
  }

  // Check generated files
  const claudeDir = path.join(targetDir, '.claude');
  const agentFiles = fs.existsSync(path.join(claudeDir, 'agents'))
    ? fs.readdirSync(path.join(claudeDir, 'agents')).filter(f => f.endsWith('.md'))
    : [];
  const skillFiles = fs.existsSync(path.join(claudeDir, 'skills'))
    ? fs.readdirSync(path.join(claudeDir, 'skills')).filter(f => f.endsWith('.md'))
    : [];

  if (agentFiles.length > 0) {
    log(colors.green, `Generated: ${agentFiles.length} agent(s), ${skillFiles.length} skill(s)`);
    console.log('');
  }

  // Next actions
  log(colors.bright, 'Claude Code Commands:');
  log(colors.cyan, '  /agentful-generate  - Analyze codebase & generate specialized agents');
  log(colors.cyan, '  /agentful-start     - Begin structured product development');
  log(colors.cyan, '  /agentful-status    - Check progress and completion percentage');
  log(colors.cyan, '  /agentful-validate  - Run quality gates (tests, lint, security)');
  log(colors.cyan, '  /agentful-decide    - Answer pending decisions');
  log(colors.cyan, '  /agentful-product   - Analyze product specification');
  log(colors.cyan, '  /agentful-analyze   - Validate agentful configuration');
  log(colors.cyan, '  /agentful           - Natural language conversation');
  console.log('');
}

/**
 * Deploy pipeline to CI/CD platform
 */
async function deploy(args) {
  const flags = parseFlags(args);
  const platform = flags.to;
  const pipelineFile = flags.pipeline || flags.p;

  if (!pipelineFile) {
    log(colors.red, 'Error: --pipeline (-p) is required');
    console.log('');
    log(colors.dim, 'Usage: agentful deploy --to <platform> --pipeline <path>');
    log(colors.dim, 'Platforms: github-actions, gitlab, jenkins');
    process.exit(1);
  }

  if (!platform) {
    log(colors.red, 'Error: --to is required');
    console.log('');
    log(colors.dim, 'Usage: agentful deploy --to <platform> --pipeline <path>');
    log(colors.dim, 'Platforms: github-actions, gitlab, jenkins');
    process.exit(1);
  }

  try {
    // Load pipeline definition
    const pipelinePath = path.resolve(process.cwd(), pipelineFile);
    const engine = new PipelineEngine();
    const pipeline = await engine.loadPipeline(pipelinePath);

    log(colors.dim, `Deploying pipeline: ${pipeline.name}`);
    log(colors.dim, `Platform: ${platform}`);
    console.log('');

    let outputPath;

    switch (platform.toLowerCase()) {
    case 'github-actions':
    case 'github':
      outputPath = flags.output || '.github/workflows/agentful.yml';
      await GitHubActionsAdapter.writeWorkflowFile(pipeline, outputPath);
      log(colors.green, `Deployed to GitHub Actions: ${outputPath}`);
      console.log('');
      log(colors.dim, 'Next steps:');
      log(colors.dim, '  1. Commit and push the workflow file');
      log(colors.dim, '  2. Check Actions tab in your GitHub repository');
      break;

    case 'gitlab':
    case 'gitlab-ci':
      outputPath = flags.output || '.gitlab-ci.yml';
      await GitLabCIAdapter.writeConfigFile(pipeline, outputPath);
      log(colors.green, `Deployed to GitLab CI: ${outputPath}`);
      console.log('');
      log(colors.dim, 'Next steps:');
      log(colors.dim, '  1. Commit and push the config file');
      log(colors.dim, '  2. Check CI/CD > Pipelines in your GitLab repository');
      break;

    case 'jenkins':
      outputPath = flags.output || 'Jenkinsfile';
      await JenkinsAdapter.writeJenkinsfile(pipeline, outputPath);
      log(colors.green, `Deployed to Jenkins: ${outputPath}`);
      console.log('');
      log(colors.dim, 'Next steps:');
      log(colors.dim, '  1. Commit and push the Jenkinsfile');
      log(colors.dim, '  2. Create/update Jenkins pipeline job to use this file');
      break;

    default:
      log(colors.red, `Unknown platform: ${platform}`);
      console.log('');
      log(colors.dim, 'Supported platforms: github-actions, gitlab, jenkins');
      process.exit(1);
    }

    console.log('');
  } catch (error) {
    log(colors.red, `Deployment failed: ${error.message}`);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Trigger a quick agent execution
 */
async function trigger(args) {
  const agentName = args[0];
  const task = args.slice(1).join(' ');

  if (!agentName) {
    log(colors.red, 'Error: Agent name is required');
    console.log('');
    log(colors.dim, 'Usage: agentful trigger <agent-name> "<task>"');
    log(colors.dim, 'Example: agentful trigger backend "Implement user authentication"');
    process.exit(1);
  }

  if (!task) {
    log(colors.red, 'Error: Task description is required');
    console.log('');
    log(colors.dim, 'Usage: agentful trigger <agent-name> "<task>"');
    log(colors.dim, 'Example: agentful trigger backend "Implement user authentication"');
    process.exit(1);
  }

  console.log('');
  log(colors.cyan, `Triggering agent: ${agentName}`);
  log(colors.dim, `Task: ${task}`);
  console.log('');

  try {
    const executor = new AgentExecutor({
      agentsDir: '.claude/agents',
      streamLogs: true
    });

    const result = await executor.execute(
      {
        id: 'triggered-task',
        agent: agentName,
        task
      },
      {},
      {
        timeout: 1800000, // 30 minutes
        onProgress: (progress) => {
          log(colors.dim, `Progress: ${progress}%`);
        },
        onLog: (message) => {
          console.log(message);
        }
      }
    );

    console.log('');
    if (result.success) {
      log(colors.green, 'Agent execution completed successfully!');
      if (result.output) {
        console.log('');
        log(colors.bright, 'Output:');
        console.log(JSON.stringify(result.output, null, 2));
      }
    } else {
      log(colors.red, 'Agent execution failed');
      if (result.error) {
        console.log('');
        log(colors.red, `Error: ${result.error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.log('');
    log(colors.red, `Execution failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Pipeline command dispatcher
 */
async function pipeline(args) {
  const subcommand = args[0];
  const subArgs = args.slice(1);

  if (!subcommand) {
    // Show pipeline help
    pipelineCLI.commands.help();
    return;
  }

  // Parse args for pipeline CLI
  const parsedArgs = pipelineCLI.parseArgs(subArgs);

  // Route to pipeline CLI command
  if (pipelineCLI.commands[subcommand]) {
    await pipelineCLI.commands[subcommand](parsedArgs);
  } else {
    log(colors.red, `Unknown pipeline command: ${subcommand}`);
    console.log('');
    pipelineCLI.commands.help();
    process.exit(1);
  }
}

/**
 * Remote command - configure and execute agents on remote servers
 * @param {string[]} args - Command arguments
 */
async function remote(args) {
  const subcommand = args[0];
  const flags = parseFlags(args);

  switch (subcommand) {
  case 'add': {
    const name = args[1];
    const url = args[2];

    if (!name || !url) {
      log(colors.red, 'Usage: agentful remote add <name> <url> [--auth=<mode>] [--secret=<key>]');
      console.log('');
      log(colors.dim, 'Examples:');
      log(colors.dim, '  agentful remote add prod http://server:3737');
      log(colors.dim, '  agentful remote add prod https://server:3737 --auth=hmac --secret=xxx');
      process.exit(1);
    }

    try {
      addRemote(name, url, {
        auth: flags.auth || 'tailscale',
        secret: flags.secret,
      });

      log(colors.green, `✓ Remote "${name}" added`);
      console.log('');
      log(colors.dim, `URL: ${url}`);
      log(colors.dim, `Auth: ${flags.auth || 'tailscale'}`);
      console.log('');
      log(colors.dim, 'Test connection:');
      log(colors.dim, `  agentful remote health ${name}`);
    } catch (error) {
      log(colors.red, `Failed to add remote: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'remove':
  case 'rm': {
    const name = args[1];

    if (!name) {
      log(colors.red, 'Usage: agentful remote remove <name>');
      process.exit(1);
    }

    try {
      removeRemote(name);
      log(colors.green, `✓ Remote "${name}" removed`);
    } catch (error) {
      log(colors.red, `Failed to remove remote: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'list':
  case 'ls': {
    const remotes = listRemotes();
    const names = Object.keys(remotes);

    if (names.length === 0) {
      log(colors.dim, 'No remotes configured');
      console.log('');
      log(colors.dim, 'Add a remote:');
      log(colors.dim, '  agentful remote add prod http://server:3737');
      process.exit(0);
    }

    console.log('');
    log(colors.bright, 'Configured Remotes:');
    console.log('');

    for (const name of names) {
      const config = remotes[name];
      log(colors.cyan, `${name}`);
      log(colors.dim, `  URL:  ${config.url}`);
      log(colors.dim, `  Auth: ${config.auth}`);
      console.log('');
    }
    break;
  }

  case 'exec':
  case 'execute': {
    const agent = args[1];
    const task = args[2];
    const remoteName = flags.remote || 'default';

    if (!agent || !task) {
      log(colors.red, 'Usage: agentful remote exec <agent> <task> [--remote=<name>] [--follow]');
      console.log('');
      log(colors.dim, 'Examples:');
      log(colors.dim, '  agentful remote exec backend "Fix memory leak"');
      log(colors.dim, '  agentful remote exec reviewer "Review PR #123" --remote=prod --follow');
      process.exit(1);
    }

    try {
      log(colors.dim, `Triggering ${agent} on ${remoteName}...`);

      const result = await executeRemoteAgent(remoteName, agent, task, {
        timeout: flags.timeout ? parseInt(flags.timeout) : undefined,
      });

      console.log('');
      log(colors.green, '✓ Execution started');
      log(colors.dim, `ID: ${result.executionId}`);
      console.log('');

      if (flags.follow) {
        log(colors.dim, 'Polling for completion...');
        console.log('');

        await pollExecution(remoteName, result.executionId, {
          interval: flags.interval ? parseInt(flags.interval) : 5000,
          onUpdate: (status) => {
            log(colors.dim, `[${status.state}] ${status.agent}: ${Math.floor((Date.now() - status.startTime) / 1000)}s`);
          },
        });

        const final = await getRemoteExecutionStatus(remoteName, result.executionId);

        console.log('');
        if (final.state === 'completed') {
          log(colors.green, '✓ Execution completed');
          console.log('');
          log(colors.bright, 'Output:');
          console.log(final.output);
        } else {
          log(colors.red, '✗ Execution failed');
          console.log('');
          log(colors.bright, 'Error:');
          console.log(final.error || 'Unknown error');
          process.exit(1);
        }
      } else {
        log(colors.dim, 'Check status:');
        log(colors.dim, `  agentful remote status ${result.executionId} --remote=${remoteName}`);
      }
    } catch (error) {
      log(colors.red, `Execution failed: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'status': {
    const executionId = args[1];
    const remoteName = flags.remote || 'default';

    if (!executionId) {
      log(colors.red, 'Usage: agentful remote status <execution-id> [--remote=<name>]');
      process.exit(1);
    }

    try {
      const status = await getRemoteExecutionStatus(remoteName, executionId);

      console.log('');
      log(colors.bright, 'Execution Status:');
      console.log('');
      log(colors.dim, `ID:       ${status.id}`);
      log(colors.dim, `Agent:    ${status.agent}`);
      log(colors.dim, `Task:     ${status.task}`);
      log(colors.dim, `State:    ${status.state}`);
      log(colors.dim, `Duration: ${Math.floor(status.duration / 1000)}s`);

      if (status.exitCode !== null) {
        log(colors.dim, `Exit:     ${status.exitCode}`);
      }

      if (status.output) {
        console.log('');
        log(colors.bright, 'Output:');
        console.log(status.output);
      }

      if (status.error) {
        console.log('');
        log(colors.red, 'Error:');
        console.log(status.error);
      }
    } catch (error) {
      log(colors.red, `Failed to get status: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'agents': {
    const remoteName = flags.remote || 'default';

    try {
      const result = await listRemoteAgents(remoteName);

      console.log('');
      log(colors.bright, `Available Agents on ${remoteName}:`);
      console.log('');

      for (const agent of result.agents) {
        log(colors.cyan, `  ${agent}`);
      }

      console.log('');
      log(colors.dim, `Total: ${result.count} agents`);
    } catch (error) {
      log(colors.red, `Failed to list agents: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'executions': {
    const remoteName = flags.remote || 'default';

    try {
      const result = await listRemoteExecutions(remoteName, {
        agent: flags.agent,
        state: flags.state,
        limit: flags.limit ? parseInt(flags.limit) : undefined,
      });

      console.log('');
      log(colors.bright, `Recent Executions on ${remoteName}:`);
      console.log('');

      if (result.executions.length === 0) {
        log(colors.dim, 'No executions found');
        process.exit(0);
      }

      for (const exec of result.executions) {
        const duration = Math.floor(exec.duration / 1000);
        log(colors.cyan, `${exec.id.substring(0, 8)} ${exec.agent}`);
        log(colors.dim, `  State: ${exec.state} (${duration}s)`);
        log(colors.dim, `  Task:  ${exec.task.substring(0, 60)}${exec.task.length > 60 ? '...' : ''}`);
        console.log('');
      }

      log(colors.dim, `Total: ${result.count} executions`);
    } catch (error) {
      log(colors.red, `Failed to list executions: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  case 'health': {
    const remoteName = args[1] || flags.remote || 'default';

    try {
      const health = await checkRemoteHealth(remoteName);

      console.log('');
      log(colors.green, `✓ ${remoteName} is healthy`);
      console.log('');
      log(colors.dim, `Status:  ${health.status}`);
      log(colors.dim, `Uptime:  ${Math.floor(health.uptime / 3600)}h`);
      log(colors.dim, `Mode:    ${health.mode}`);
    } catch (error) {
      log(colors.red, `Health check failed: ${error.message}`);
      process.exit(1);
    }
    break;
  }

  default:
    log(colors.red, `Unknown subcommand: ${subcommand}`);
    console.log('');
    log(colors.dim, 'Available subcommands:');
    log(colors.dim, '  add        - Add a remote server');
    log(colors.dim, '  remove     - Remove a remote server');
    log(colors.dim, '  list       - List configured remotes');
    log(colors.dim, '  exec       - Execute an agent on a remote');
    log(colors.dim, '  status     - Check execution status');
    log(colors.dim, '  agents     - List available agents');
    log(colors.dim, '  executions - List recent executions');
    log(colors.dim, '  health     - Check server health');
    process.exit(1);
  }
}

/**
 * Get PID file path
 * @returns {string} Path to PID file
 */
function getPidFilePath() {
  return path.join(process.cwd(), '.agentful', 'server.pid');
}

/**
 * Start server in daemon mode
 * @param {string[]} args - Original args
 * @param {Object} config - Server configuration
 */
async function startDaemon(args, config) {
  const { spawn } = await import('child_process');

  // Check if daemon is already running
  const pidFile = getPidFilePath();
  if (fs.existsSync(pidFile)) {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);

    // Check if process is still running
    try {
      process.kill(pid, 0); // Signal 0 checks if process exists
      log(colors.yellow, 'Server is already running');
      log(colors.dim, `PID: ${pid}`);
      console.log('');
      log(colors.dim, 'To stop: agentful serve --stop');
      log(colors.dim, 'To check status: agentful serve --status');
      process.exit(1);
    } catch (error) {
      // Process doesn't exist, clean up stale PID file
      fs.unlinkSync(pidFile);
    }
  }

  // Ensure .agentful directory exists
  const agentfulDir = path.join(process.cwd(), '.agentful');
  if (!fs.existsSync(agentfulDir)) {
    fs.mkdirSync(agentfulDir, { recursive: true });
  }

  // Prepare args for child process (remove --daemon flag)
  const childArgs = args.filter(arg => !arg.startsWith('--daemon') && arg !== '-d');

  // Create log files for daemon output
  const logFile = path.join(agentfulDir, 'server.log');
  const errLogFile = path.join(agentfulDir, 'server.err.log');
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(errLogFile, 'a');

  // Spawn detached child process
  const child = spawn(
    process.argv[0], // node executable
    [process.argv[1], 'serve', ...childArgs], // script path and args
    {
      detached: true,
      stdio: ['ignore', out, err],
      cwd: process.cwd(),
      env: {
        ...process.env,
        AGENTFUL_DAEMON: '1' // Flag to indicate we're running as daemon
      }
    }
  );

  // Unref immediately to allow parent to exit independently
  child.unref();

  // Wait for server to start (check health endpoint)
  const maxAttempts = 10;
  let started = false;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      const response = await fetch(`http://localhost:${config.port}/health`);
      if (response.ok) {
        started = true;
        break;
      }
    } catch {
      // Server not ready yet
    }
  }

  if (!started) {
    log(colors.yellow, 'Warning: Server may not have started successfully');
    log(colors.dim, `Check logs: ${logFile}`);
  }

  // Write PID file after confirming server started
  fs.writeFileSync(pidFile, child.pid.toString(), 'utf-8');

  // Show success message
  log(colors.green, `Server started in background (PID: ${child.pid})`);
  console.log('');
  log(colors.dim, `PID file: ${pidFile}`);
  log(colors.dim, `Port: ${config.port}`);
  log(colors.dim, `Auth: ${config.auth}`);
  log(colors.dim, `Logs: ${logFile}`);
  console.log('');
  log(colors.dim, 'Commands:');
  log(colors.dim, '  agentful serve --stop     Stop the daemon');
  log(colors.dim, '  agentful serve --status   Check daemon status');
  console.log('');
}

/**
 * Stop daemon server
 */
async function stopDaemon() {
  const pidFile = getPidFilePath();

  if (!fs.existsSync(pidFile)) {
    log(colors.yellow, 'No daemon server running');
    log(colors.dim, 'PID file not found');
    process.exit(1);
  }

  const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);

  // Try to kill the process
  try {
    process.kill(pid, 'SIGTERM');

    // Wait a moment for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if process is still running
    try {
      process.kill(pid, 0);
      // Still running, force kill
      log(colors.yellow, 'Graceful shutdown failed, forcing...');
      process.kill(pid, 'SIGKILL');
    } catch {
      // Process stopped successfully
    }

    // Remove PID file
    fs.unlinkSync(pidFile);

    log(colors.green, `Server stopped (PID: ${pid})`);
  } catch (error) {
    if (error.code === 'ESRCH') {
      // Process doesn't exist
      log(colors.yellow, 'Server process not found (stale PID file)');
      fs.unlinkSync(pidFile);
    } else if (error.code === 'EPERM') {
      log(colors.red, `Permission denied to kill process ${pid}`);
      log(colors.dim, 'Try: sudo agentful serve --stop');
      process.exit(1);
    } else {
      log(colors.red, `Failed to stop server: ${error.message}`);
      process.exit(1);
    }
  }
}

/**
 * Check daemon server status
 */
async function checkDaemonStatus() {
  const pidFile = getPidFilePath();

  if (!fs.existsSync(pidFile)) {
    log(colors.yellow, 'No daemon server running');
    log(colors.dim, 'PID file not found');
    console.log('');
    log(colors.dim, 'Start daemon: agentful serve --daemon');
    process.exit(1);
  }

  const pid = parseInt(fs.readFileSync(pidFile, 'utf-8').trim(), 10);

  // Check if process is running
  try {
    process.kill(pid, 0); // Signal 0 just checks if process exists

    log(colors.green, 'Server is running');
    console.log('');
    log(colors.dim, `PID: ${pid}`);
    log(colors.dim, `PID file: ${pidFile}`);

    // Try to get more info from /proc (Linux/macOS)
    try {
      const { execSync } = await import('child_process');
      const psOutput = execSync(`ps -p ${pid} -o comm,etime,rss`, { encoding: 'utf-8' });
      const lines = psOutput.trim().split('\n');
      if (lines.length > 1) {
        const [cmd, etime, rss] = lines[1].trim().split(/\s+/);
        console.log('');
        log(colors.dim, `Uptime: ${etime}`);
        log(colors.dim, `Memory: ${Math.round(parseInt(rss) / 1024)} MB`);
      }
    } catch {
      // ps command failed, skip detailed info
    }

    console.log('');
    log(colors.dim, 'Commands:');
    log(colors.dim, '  agentful serve --stop     Stop the daemon');
  } catch (error) {
    if (error.code === 'ESRCH') {
      log(colors.yellow, 'Server not running (stale PID file)');
      log(colors.dim, `PID file exists but process ${pid} not found`);
      console.log('');
      log(colors.dim, 'Clean up: rm .agentful/server.pid');
      process.exit(1);
    } else {
      log(colors.red, `Failed to check status: ${error.message}`);
      process.exit(1);
    }
  }
}

/**
 * Serve command - Start remote execution server
 */
async function serve(args) {
  const flags = parseFlags(args);

  // Handle --stop subcommand
  if (flags.stop) {
    return await stopDaemon();
  }

  // Handle --status subcommand
  if (flags.status) {
    return await checkDaemonStatus();
  }

  // Handle --help flag first
  if (flags.help || flags.h) {
    showBanner();
    log(colors.bright, 'Agentful Remote Execution Server');
    console.log('');
    log(colors.dim, 'Start a secure HTTP server for remote agent execution.');
    console.log('');
    log(colors.bright, 'USAGE:');
    console.log(`  ${colors.green}agentful serve${colors.reset} ${colors.dim}[options]${colors.reset}`);
    console.log('');
    log(colors.bright, 'AUTHENTICATION MODES:');
    console.log(`  ${colors.cyan}--auth=tailscale${colors.reset}   ${colors.dim}(default) Tailscale network only${colors.reset}`);
    console.log(`  ${colors.cyan}--auth=hmac${colors.reset}        ${colors.dim}HMAC signature authentication (requires --secret)${colors.reset}`);
    console.log(`  ${colors.cyan}--auth=none${colors.reset}        ${colors.dim}No authentication (binds to all interfaces, use with SSH tunnel)${colors.reset}`);
    console.log('');
    log(colors.bright, 'OPTIONS:');
    console.log(`  ${colors.yellow}--port=<number>${colors.reset}      ${colors.dim}Server port (default: 3000)${colors.reset}`);
    console.log(`  ${colors.yellow}--secret=<key>${colors.reset}       ${colors.dim}HMAC secret key (required for --auth=hmac)${colors.reset}`);
    console.log(`  ${colors.yellow}--https${colors.reset}             ${colors.dim}Enable HTTPS (requires --cert and --key)${colors.reset}`);
    console.log(`  ${colors.yellow}--cert=<path>${colors.reset}        ${colors.dim}SSL certificate file path${colors.reset}`);
    console.log(`  ${colors.yellow}--key=<path>${colors.reset}         ${colors.dim}SSL private key file path${colors.reset}`);
    console.log(`  ${colors.yellow}--daemon, -d${colors.reset}        ${colors.dim}Run server in background (daemon mode)${colors.reset}`);
    console.log(`  ${colors.yellow}--stop${colors.reset}              ${colors.dim}Stop background server${colors.reset}`);
    console.log(`  ${colors.yellow}--status${colors.reset}            ${colors.dim}Check background server status${colors.reset}`);
    console.log(`  ${colors.yellow}--help, -h${colors.reset}          ${colors.dim}Show this help message${colors.reset}`);
    console.log('');
    log(colors.bright, 'EXAMPLES:');
    console.log('');
    log(colors.dim, '  # Start server with Tailscale auth (default)');
    console.log(`  ${colors.green}agentful serve${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Start server with HMAC authentication');
    console.log(`  ${colors.green}agentful serve --auth=hmac --secret=your-secret-key${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Start HTTPS server with HMAC auth');
    console.log(`  ${colors.green}agentful serve --auth=hmac --secret=key --https --cert=cert.pem --key=key.pem${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Start server without auth (public access, use SSH tunnel)');
    console.log(`  ${colors.green}agentful serve --auth=none --port=3737${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Start server in background (daemon mode)');
    console.log(`  ${colors.green}agentful serve --daemon${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Check daemon status');
    console.log(`  ${colors.green}agentful serve --status${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Stop daemon');
    console.log(`  ${colors.green}agentful serve --stop${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Generate HMAC secret');
    console.log(`  ${colors.green}openssl rand -hex 32${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Generate self-signed certificate');
    console.log(`  ${colors.green}openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes${colors.reset}`);
    console.log('');
    log(colors.bright, 'SECURITY NOTES:');
    console.log(`  ${colors.yellow}Tailscale mode:${colors.reset} Binds to 0.0.0.0, relies on Tailscale network isolation`);
    console.log(`  ${colors.yellow}HMAC mode:${colors.reset}      Binds to 0.0.0.0, uses cryptographic signatures (recommended for public networks)`);
    console.log(`  ${colors.yellow}None mode:${colors.reset}       Binds to 0.0.0.0, no authentication (use SSH tunnel: ssh -L 3000:localhost:3000 user@host)`);
    console.log('');
    return;
  }

  // Parse configuration
  const config = {
    auth: flags.auth || 'tailscale',
    port: parseInt(flags.port || '3000', 10),
    secret: flags.secret,
    https: flags.https || false,
    cert: flags.cert,
    key: flags.key,
    projectRoot: process.cwd(),
  };

  // Check if --daemon flag is set
  const isDaemon = flags.daemon || flags.d;

  // Validate auth mode
  const validAuthModes = ['tailscale', 'hmac', 'none'];
  if (!validAuthModes.includes(config.auth)) {
    log(colors.red, `Invalid auth mode: ${config.auth}`);
    console.log('');
    log(colors.dim, 'Valid modes: tailscale, hmac, none');
    console.log('');
    log(colors.dim, 'Usage examples:');
    log(colors.dim, '  agentful serve                                    # Tailscale mode (default)');
    log(colors.dim, '  agentful serve --auth=hmac --secret=key --https   # HMAC with HTTPS');
    log(colors.dim, '  agentful serve --auth=none                        # Localhost only');
    process.exit(1);
  }

  // If daemon mode, fork the process
  if (isDaemon) {
    return await startDaemon(args, config);
  }

  // Show configuration (skip banner if running as daemon child)
  if (!process.env.AGENTFUL_DAEMON) {
    showBanner();
  }
  log(colors.bright, 'Starting Agentful Server');
  console.log('');
  log(colors.dim, `Authentication: ${config.auth}`);
  log(colors.dim, `Port: ${config.port}`);
  log(colors.dim, `HTTPS: ${config.https ? 'enabled' : 'disabled'}`);

  if (config.auth === 'none') {
    log(colors.yellow, 'Warning: Server running with no authentication (binds to all interfaces)');
    log(colors.dim, 'Recommended: Use SSH tunnel for remote access: ssh -L 3000:localhost:3000 user@host');
  }

  if (config.auth === 'hmac' && !config.secret) {
    console.log('');
    log(colors.red, 'Error: --secret is required for HMAC mode');
    console.log('');
    log(colors.dim, 'Generate a secret:');
    log(colors.dim, '  openssl rand -hex 32');
    process.exit(1);
  }

  if (config.https && (!config.cert || !config.key)) {
    console.log('');
    log(colors.red, 'Error: --cert and --key are required for HTTPS mode');
    console.log('');
    log(colors.dim, 'Generate self-signed certificate:');
    log(colors.dim, '  openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes');
    process.exit(1);
  }

  console.log('');

  try {
    await startServerFromCLI(config);
  } catch (error) {
    console.log('');
    log(colors.red, `Failed to start server: ${error.message}`);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * MCP command - Start MCP server
 * @param {string[]} args - Command arguments
 */
async function mcp(args) {
  const flags = parseFlags(args);

  // Handle --help flag
  if (flags.help || flags.h) {
    showBanner();
    log(colors.bright, 'Agentful MCP Server');
    console.log('');
    log(colors.dim, 'Start a Model Context Protocol server for AI assistants.');
    console.log('');
    log(colors.bright, 'USAGE:');
    console.log(`  ${colors.green}agentful mcp${colors.reset} ${colors.dim}[options]${colors.reset}`);
    console.log('');
    log(colors.bright, 'OPTIONS:');
    console.log(`  ${colors.yellow}--transport=<mode>${colors.reset}    Transport mode: stdio|http|sse (default: stdio)`);
    console.log(`  ${colors.yellow}--port=<number>${colors.reset}       HTTP/SSE server port (default: 3838)`);
    console.log(`  ${colors.yellow}--host=<address>${colors.reset}      HTTP/SSE bind address (default: localhost)`);
    console.log(`  ${colors.yellow}--help, -h${colors.reset}            Show this help`);
    console.log('');
    log(colors.bright, 'EXAMPLES:');
    console.log('');
    log(colors.dim, '  # Start stdio server (for Claude Code, Kiro)');
    console.log(`  ${colors.green}agentful mcp${colors.reset}`);
    console.log('');
    log(colors.dim, '  # Start HTTP server');
    console.log(`  ${colors.green}agentful mcp --transport=http --port=3838${colors.reset}`);
    console.log('');
    log(colors.bright, 'CLAUDE CODE CONFIGURATION:');
    console.log('');
    console.log('  Add to ~/.config/claude-code/config.json:');
    console.log('');
    console.log('  {');
    console.log('    "mcpServers": {');
    console.log('      "agentful": {');
    console.log('        "command": "agentful",');
    console.log('        "args": ["mcp"]');
    console.log('      }');
    console.log('    }');
    console.log('  }');
    console.log('');
    process.exit(0);
  }

  // Build args for mcp-server.js
  const mcpArgs = [];

  if (flags.transport) {
    mcpArgs.push(`--transport=${flags.transport}`);
  }

  if (flags.port) {
    mcpArgs.push(`--port=${flags.port}`);
  }

  if (flags.host) {
    mcpArgs.push(`--host=${flags.host}`);
  }

  if (flags['log-level']) {
    mcpArgs.push(`--log-level=${flags['log-level']}`);
  }

  // Get path to mcp-server.js
  const mcpServerPath = path.join(__dirname, '../mcp/bin/mcp-server.js');

  try {
    // Import dynamically to execute
    const { spawn } = await import('child_process');

    // Spawn MCP server process
    const child = spawn(process.argv[0], [mcpServerPath, ...mcpArgs], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    // Handle child process exit
    child.on('exit', (code) => {
      process.exit(code || 0);
    });

    // Handle parent process termination
    process.on('SIGINT', () => {
      child.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      child.kill('SIGTERM');
    });

  } catch (error) {
    log(colors.red, `Failed to start MCP server: ${error.message}`);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * CI command - Generate prompts for claude-code-action
 */
async function ci(args) {
  const flags = parseFlags(args);

  // Generate workflow file
  if (flags['generate-workflow']) {
    const platform = flags.platform || 'github';
    const agents = flags.agents ? parseArrayFlag(flags.agents) : ['backend', 'frontend', 'reviewer'];
    const triggers = flags.triggers ? parseArrayFlag(flags.triggers) : ['pull_request'];

    try {
      log(colors.dim, `Generating ${platform} workflow...`);
      const workflow = await generateWorkflow({
        platform,
        agents,
        triggers,
        options: {
          nodeVersion: flags['node-version'] || '22.x',
          runsOn: flags['runs-on'] || 'ubuntu-latest',
          branches: flags.branches ? parseArrayFlag(flags.branches) : ['main', 'develop'],
        },
      });

      const outputPath = await writeWorkflowFile(workflow, platform);

      console.log('');
      log(colors.green, `Workflow generated: ${outputPath}`);
      console.log('');
      log(colors.dim, 'Next steps:');
      log(colors.dim, '  1. Review the generated workflow file');
      log(colors.dim, '  2. Add ANTHROPIC_API_KEY to your CI secrets');
      log(colors.dim, '  3. Commit and push to trigger the workflow');
      console.log('');
    } catch (error) {
      log(colors.red, `Failed to generate workflow: ${error.message}`);
      if (flags.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
    return;
  }

  // List available agents
  if (flags.list || flags.l) {
    try {
      const agents = await listAvailableAgents();

      console.log('');
      log(colors.bright, 'Available Agents:');
      console.log('');

      if (agents.length === 0) {
        log(colors.yellow, 'No agents found. Run "agentful init" first.');
      } else {
        agents.forEach(agent => {
          log(colors.green, `  ${agent}`);
        });
      }

      console.log('');
    } catch (error) {
      log(colors.red, `Failed to list agents: ${error.message}`);
      process.exit(1);
    }
    return;
  }

  // Generate prompt for agent
  const agentName = args.find(arg => !arg.startsWith('--'));
  const taskStartIndex = args.findIndex(arg => !arg.startsWith('--') && arg !== agentName);
  const task = taskStartIndex >= 0 ? args.slice(taskStartIndex).join(' ') : '';

  if (!agentName) {
    log(colors.red, 'Error: Agent name is required');
    console.log('');
    log(colors.dim, 'Usage: agentful ci <agent-name> "<task>"');
    log(colors.dim, 'Example: agentful ci backend "Review API changes"');
    console.log('');
    log(colors.dim, 'Options:');
    log(colors.dim, '  --list                    List available agents');
    log(colors.dim, '  --generate-workflow       Generate CI workflow file');
    log(colors.dim, '  --platform=<name>         CI platform (github, gitlab, jenkins)');
    log(colors.dim, '  --agents=<list>           Agents to include in workflow');
    log(colors.dim, '  --no-ci-context           Exclude CI metadata from prompt');
    console.log('');
    process.exit(1);
  }

  if (!task) {
    log(colors.red, 'Error: Task description is required');
    console.log('');
    log(colors.dim, 'Usage: agentful ci <agent-name> "<task>"');
    log(colors.dim, 'Example: agentful ci backend "Review API changes"');
    process.exit(1);
  }

  try {
    const prompt = await buildCIPrompt(agentName, task, {
      includeCIContext: !flags['no-ci-context'],
      context: flags.context ? JSON.parse(flags.context) : {},
    });

    // Output the prompt (can be piped to claude-code-action)
    console.log(prompt);
  } catch (error) {
    log(colors.red, `Failed to build prompt: ${error.message}`);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Main CLI
async function main() {
  // Check Node.js version for native fetch() support
  const nodeVersion = parseInt(process.version.slice(1).split('.')[0]);
  if (nodeVersion < 22) {
    console.error(`${colors.red}Error: agentful requires Node.js 22.0.0 or higher${colors.reset}`);
    console.error(`${colors.dim}   Current version: ${process.version}${colors.reset}`);
    console.error(`${colors.dim}   Download: https://nodejs.org/${colors.reset}`);
    console.error('');
    console.error(`${colors.dim}   Reason: This CLI uses native fetch() API (Node.js 22+)${colors.reset}`);
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
  case 'init':
    await init(args.slice(1));
    break;

  case 'status':
    showStatus();
    break;

  case 'presets':
    showPresets();
    break;

  case 'deploy':
    await deploy(args.slice(1));
    break;

  case 'trigger':
    await trigger(args.slice(1));
    break;

  case 'pipeline':
    await pipeline(args.slice(1));
    break;

  case 'ci':
    await ci(args.slice(1));
    break;

  case 'serve':
    await serve(args.slice(1));
    break;

  case 'remote':
    await remote(args.slice(1));
    break;

  case 'mcp':
    await mcp(args.slice(1));
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  case 'version':
  case '--version':
  case '-v':
    showVersion();
    break;

  default:
    if (!command) {
      showHelp();
    } else {
      log(colors.red, `Unknown command: ${command}`);
      console.log('');
      log(colors.dim, 'Run: agentful help');
      process.exit(1);
    }
  }
}

main().catch(err => {
  log(colors.red, 'Error:', err.message);
  process.exit(1);
});
