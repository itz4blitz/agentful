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
 * Serve command - Start remote execution server
 */
async function serve(args) {
  const flags = parseFlags(args);

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

  // Show configuration
  showBanner();
  log(colors.bright, 'Starting Agentful Server');
  console.log('');
  log(colors.dim, `Authentication: ${config.auth}`);
  log(colors.dim, `Port: ${config.port}`);
  log(colors.dim, `HTTPS: ${config.https ? 'enabled' : 'disabled'}`);

  if (config.auth === 'none') {
    log(colors.yellow, 'Warning: Server will only accept localhost connections');
    log(colors.dim, 'Use SSH tunnel for remote access: ssh -L 3000:localhost:3000 user@host');
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
