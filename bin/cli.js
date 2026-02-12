#!/usr/bin/env node

/**
 * agentful CLI - Template initialization and status
 *
 * Core functionality:
 * - Install templates (agents, skills, commands, hooks)
 * - Show installation status
 * - Display available presets
 *
 * Development happens in Claude Code using slash commands:
 * - /agentful-generate - Analyze codebase & generate agents
 * - /agentful-start - Begin structured development
 * - /agentful-status - Check progress
 * - /agentful-validate - Run quality gates
 *
 * REQUIREMENTS:
 * - Node.js 22.0.0 or higher (native fetch() support)
 */

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { initProject, isInitialized } from '../lib/init.js';
import {
  getPreset,
  listPresets,
  parseArrayFlag,
  mergePresetWithFlags,
  validateConfiguration
} from '../lib/presets.js';
import {  detectTeammateTool, enableTeammateTool } from '../lib/parallel-execution.js';

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
  console.log(`  ${colors.green}help${colors.reset}         Show this help message`);
  console.log(`  ${colors.green}--version${colors.reset}    Show version`);
  console.log('');
  console.log('INIT OPTIONS (optional):');
  console.log(`  ${colors.yellow}--preset=minimal${colors.reset}       Minimal setup (orchestrator + backend only)`);
  console.log(`  ${colors.yellow}--agents=<list>${colors.reset}         Custom agents (comma-separated)`);
  console.log(`  ${colors.yellow}--skills=<list>${colors.reset}         Custom skills (comma-separated)`);
  console.log(`  ${colors.yellow}--hooks=<list>${colors.reset}          Custom hooks (comma-separated)`);
  console.log(`  ${colors.yellow}--gates=<list>${colors.reset}          Custom quality gates (comma-separated)`);
  console.log(`  ${colors.yellow}--skip-mcp${colors.reset}              Skip automatic MCP server setup`);
  console.log('');
  console.log('EXAMPLES:');
  console.log(`  ${colors.dim}# Install agentful (all components - recommended)${colors.reset}`);
  console.log(`  ${colors.bright}agentful init${colors.reset}`);
  console.log('');
  console.log(`  ${colors.dim}# Minimal setup (for simple scripts/CLIs)${colors.reset}`);
  console.log(`  ${colors.bright}agentful init --preset=minimal${colors.reset}`);
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
  log(colors.dim, '  Includes: 8 agents, 7 skills, all hooks, all gates');
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

const MCP_SERVER_NAME = 'agentful';
const MCP_SERVER_PACKAGE = '@itz4blitz/agentful-mcp-server';
const MCP_SETUP_COMMAND = `claude mcp add ${MCP_SERVER_NAME} -- npx -y ${MCP_SERVER_PACKAGE}`;

function parseMcpInstallState() {
  const result = spawnSync('claude', ['mcp', 'list'], {
    encoding: 'utf8'
  });

  if (result.error) {
    return {
      ok: false,
      reason: result.error.code === 'ENOENT' ? 'claude-not-found' : result.error.message
    };
  }

  if (result.status !== 0) {
    return {
      ok: false,
      reason: (result.stderr || result.stdout || '').trim() || 'claude mcp list failed'
    };
  }

  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  const installed = new RegExp(`^\\s*${MCP_SERVER_NAME}(\\s|$)`, 'm').test(output);

  return {
    ok: true,
    installed
  };
}

function ensureAgentfulMcpInstalled() {
  const state = parseMcpInstallState();
  if (!state.ok) {
    return {
      status: 'unavailable',
      reason: state.reason
    };
  }

  if (state.installed) {
    return { status: 'already-installed' };
  }

  const addResult = spawnSync('claude', ['mcp', 'add', MCP_SERVER_NAME, '--', 'npx', '-y', MCP_SERVER_PACKAGE], {
    encoding: 'utf8'
  });

  if (addResult.error) {
    return {
      status: 'failed',
      reason: addResult.error.message
    };
  }

  if (addResult.status !== 0) {
    return {
      status: 'failed',
      reason: (addResult.stderr || addResult.stdout || '').trim() || 'claude mcp add failed'
    };
  }

  const verify = parseMcpInstallState();
  if (!verify.ok || !verify.installed) {
    return {
      status: 'failed',
      reason: !verify.ok ? verify.reason : 'MCP server not visible after install'
    };
  }

  return { status: 'installed' };
}

async function init(args) {
  showBanner();

  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

  // Parse flags
  const flags = parseFlags(args);

  // Build configuration from preset and/or flags
  let config = null;

  if (flags.config) {
    log(colors.red, '--config is no longer supported.');
    log(colors.dim, 'Use local CLI flags instead: --preset, --agents, --skills, --hooks, --gates');
    process.exit(1);
  }

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

    // Enable parallel execution
    log(colors.dim, 'Checking parallel execution support...');
    const detection = detectTeammateTool();

    if (detection.available) {
      if (detection.autoEnabled) {
        log(colors.green, '✓ Parallel execution enabled (TeammateTool auto-patched)');
      } else {
        log(colors.green, '✓ Parallel execution available');
      }
    } else if (detection.canEnable) {
      log(colors.yellow, '⚡ Enabling parallel execution...');
      const result = enableTeammateTool();
      if (result.success) {
        log(colors.green, '✓ Parallel execution enabled successfully');
        log(colors.dim, `  Backup created: ${result.backupPath}`);
      } else {
        log(colors.yellow, '⚠ Could not enable parallel execution');
        log(colors.dim, `  Reason: ${result.error}`);
        log(colors.dim, '  Agents will run sequentially (still works, just slower)');
      }
    } else {
      log(colors.yellow, '⚠ Parallel execution not available');
      log(colors.dim, `  Reason: ${detection.reason}`);
      log(colors.dim, '  Agents will run sequentially (still works, just slower)');
    }
    console.log('');
  } catch (error) {
    log(colors.red, `Failed to initialize: ${error.message}`);
    process.exit(1);
  }

  // Update .gitignore
  checkGitignore();

  // Configure Agentful MCP server by default (non-fatal)
  const skipMcpSetup = Boolean(flags['skip-mcp']);
  const mcpSetupResult = skipMcpSetup ? { status: 'skipped' } : ensureAgentfulMcpInstalled();

  if (skipMcpSetup) {
    log(colors.dim, 'Skipped MCP setup (--skip-mcp)');
    console.log('');
  } else if (mcpSetupResult.status === 'installed') {
    log(colors.green, '✓ Agentful MCP server configured');
    console.log('');
  } else if (mcpSetupResult.status === 'already-installed') {
    log(colors.green, '✓ Agentful MCP server already configured');
    console.log('');
  } else {
    log(colors.yellow, '⚠ Could not auto-configure Agentful MCP server');
    if (mcpSetupResult.reason) {
      log(colors.dim, `  Reason: ${mcpSetupResult.reason}`);
    }
    log(colors.dim, `  Run manually: ${MCP_SETUP_COMMAND}`);
    console.log('');
  }

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
  if (skipMcpSetup) {
    log(colors.bright, 'Pattern Learning (Skipped)');
    console.log('');
    log(colors.dim, '  You skipped automatic MCP setup with --skip-mcp.');
    log(colors.dim, '  Enable it later with:');
    console.log('');
    log(colors.cyan, `    ${MCP_SETUP_COMMAND}`);
    console.log('');
  } else if (mcpSetupResult.status !== 'installed' && mcpSetupResult.status !== 'already-installed') {
    log(colors.bright, 'Pattern Learning (Manual Step Required)');
    console.log('');
    log(colors.dim, '  Agents get smarter when they can store and reuse patterns.');
    log(colors.dim, '  Run this once to enable:');
    console.log('');
    log(colors.cyan, `    ${MCP_SETUP_COMMAND}`);
    console.log('');
  }
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
