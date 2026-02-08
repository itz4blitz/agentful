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
  log(colors.bright, 'Recommended: Enable Pattern Learning');
  console.log('');
  log(colors.dim, '  Agents get smarter when they can store and reuse patterns.');
  log(colors.dim, '  Run this once to enable:');
  console.log('');
  log(colors.cyan, '    claude mcp add agentful -- npx -y @itz4blitz/agentful-mcp-server');
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
