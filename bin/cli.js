#!/usr/bin/env node

/**
 * agentful CLI - Thin wrapper for template initialization and status
 *
 * Smart analysis and generation happens in Claude Code using:
 * - /agentful-agents command
 * - /agentful-skills command
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initProject, isInitialized } from '../lib/init.js';

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
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function showBanner() {
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
  console.log(`  ${colors.bright}agentful${colors.reset} ${colors.green}<command>${colors.reset}`);
  console.log('');
  console.log('COMMANDS:');
  console.log(`  ${colors.green}init${colors.reset}         Initialize agentful (copy templates)`);
  console.log(`  ${colors.green}status${colors.reset}       Show agentful status and generated files`);
  console.log(`  ${colors.green}help${colors.reset}         Show this help message`);
  console.log(`  ${colors.green}--version${colors.reset}    Show version`);
  console.log('');
  console.log('AFTER INIT:');
  console.log(`  1. ${colors.bright}Run claude${colors.reset} to start Claude Code`);
  console.log(`  2. ${colors.bright}Type /agentful-generate${colors.reset} to analyze codebase & generate agents`);
  console.log('');
  console.log('CLAUDE CODE COMMANDS:');
  console.log(`  ${colors.cyan}/agentful-generate${colors.reset}     - Analyze codebase, generate agents & skills`);
  console.log(`  ${colors.cyan}/agentful-start${colors.reset}    - Begin structured development workflow`);
  console.log(`  ${colors.cyan}/agentful-status${colors.reset}   - Show progress and completion`);
  console.log(`  ${colors.cyan}/agentful${colors.reset}          - Natural conversation about your product`);
  console.log('');
}

function showVersion() {
  console.log(`agentful v${VERSION}`);
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

async function init() {
  showBanner();

  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');

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
  log(colors.dim, 'Copying templates...');
  try {
    const result = await initProject(targetDir, { includeProduct: true });

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
  log(colors.cyan, '  2. Type: /agentful-generate');
  console.log('');
  log(colors.dim, 'This will analyze your codebase and generate:');
  log(colors.dim, '  - Specialized agents for your tech stack');
  log(colors.dim, '  - Domain-specific agents (auth, billing, etc.)');
  log(colors.dim, '  - Skills for frameworks you use');
  console.log('');
  log(colors.dim, 'Optional: Edit CLAUDE.md and PRODUCT.md first to customize.');
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
    log(colors.dim, `  Agents: ${agentCount} ${agentCount === 0 ? '(run /agentful-agents)' : ''}`);
    log(colors.dim, `  Skills: ${skillCount} ${skillCount === 0 ? '(run /agentful-skills)' : ''}`);
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
  log(colors.cyan, '  /agentful-agents  - Generate agents');
  log(colors.cyan, '  /agentful-skills  - Generate skills');
  log(colors.cyan, '  /agentful-start   - Start workflow');
  log(colors.cyan, '  /agentful         - Product chat');
  console.log('');
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      await init();
      break;

    case 'status':
      showStatus();
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
