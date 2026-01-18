#!/usr/bin/env node

/**
 * Agentful CLI
 * One-click autonomous product development kit for Claude Code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '0.1.0-alpha';
const AGENTFUL_DIR = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(AGENTFUL_DIR, 'template');

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
  log(colors.cyan, '    ___    __  ____________  ____  ___   ____________ ');
  log(colors.cyan, '   /   |  / / / /_  __/ __ \\/ __ \\/ _ | / ____/  _/ / ');
  log(colors.cyan, '  / /| | / / / / / / / /_/ / /_/ /  __ |/ /    / // /  ');
  log(colors.cyan, ' / ___ |/ /_/ / / / / _, _/ _, _/ /_/ / /___/ // /   ');
  log(colors.cyan, '/_/  |_|_____/ /_/_/ /_/ |_/_/ |_|\\____/\\____/___/    ');
  console.log('');
  log(colors.dim, `                   v${VERSION}                           `);
  console.log('');
}

function showHelp() {
  showBanner();
  console.log('USAGE:');
  console.log(`  ${colors.bright}agentful${colors.reset} ${colors.green}<command>${colors.reset}`);
  console.log('');
  console.log('COMMANDS:');
  console.log(`  ${colors.green}init${colors.reset}         Initialize Agentful in current directory`);
  console.log(`  ${colors.green}init --bare${colors.reset}  Skip creating templates (just .claude/)`);
  console.log(`  ${colors.green}generate${colors.reset}     Generate specialized agents from tech stack`);
  console.log(`  ${colors.green}status${colors.reset}       Show current development progress`);
  console.log(`  ${colors.green}--help${colors.reset}       Show this help message`);
  console.log(`  ${colors.green}--version${colors.reset}    Show version`);
  console.log('');
  console.log('AFTER INIT:');
  console.log(`  1. Edit ${colors.bright}PRODUCT.md${colors.reset} with your product specification`);
  console.log(`     - Define features with priorities: CRITICAL, HIGH, MEDIUM, LOW`);
  console.log(`     - Add user stories: "As a [user], I want [feature] so that [benefit]"`);
  console.log(`  2. Run ${colors.bright}claude${colors.reset} to start Claude Code`);
  console.log(`  3. Type ${colors.bright}/agentful-start${colors.reset} to begin autonomous development`);
  console.log('');
  console.log('FOR 24/7 DEVELOPMENT:');
  console.log(`  ${colors.cyan}/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"${colors.reset}`);
  console.log('');
}

function showVersion() {
  console.log(`Agentful v${VERSION}`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function checkGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let content = '';

  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }

  const agentfulIgnore = '# Agentful runtime state\n.agentful/\n';

  if (!content.includes('.agentful/')) {
    fs.appendFileSync(gitignorePath, agentfulIgnore);
    log(colors.dim, 'Added .agentful/ to .gitignore');
  }
}

async function initAgentful(options = { bare: false }) {
  showBanner();

  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const agentfulDir = path.join(targetDir, '.agentful');

  // Check if already initialized
  if (fs.existsSync(claudeDir)) {
    log(colors.yellow, '⚠️  .claude/ directory already exists!');
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

    log(colors.dim, 'Removing existing .claude/...');
    fs.rmSync(claudeDir, { recursive: true, force: true });
  }

  // Create .claude/ directory structure
  log(colors.dim, 'Creating .claude/ directory structure...');

  const sourceClaudeDir = path.join(AGENTFUL_DIR, '.claude');
  copyDir(sourceClaudeDir, claudeDir);

  // Create .agentful/ directory
  if (!fs.existsSync(agentfulDir)) {
    fs.mkdirSync(agentfulDir, { recursive: true });
  }

  // Initialize state files
  log(colors.dim, 'Initializing state files...');

  const now = new Date().toISOString();

  fs.writeFileSync(
    path.join(agentfulDir, 'state.json'),
    JSON.stringify(
      {
        version: '0.1.0',
        current_task: null,
        current_phase: 'idle',
        iterations: 0,
        last_updated: now,
        blocked_on: []
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(agentfulDir, 'decisions.json'),
    JSON.stringify({ pending: [], resolved: [] }, null, 2)
  );

  fs.writeFileSync(
    path.join(agentfulDir, 'completion.json'),
    JSON.stringify(
      {
        features: {},
        gates: {
          tests_passing: false,
          no_type_errors: false,
          no_dead_code: false,
          coverage_80: false,
          security_clean: false
        },
        overall: 0,
        last_updated: now
      },
      null,
      2
    )
  );

  fs.writeFileSync(
    path.join(agentfulDir, 'architecture.json'),
    JSON.stringify(
      {
        detected_stack: {},
        generated_agents: [],
        decisions: [],
        timestamp: now
      },
      null,
      2
    )
  );

  // Copy templates if not bare mode
  if (!options.bare) {
    log(colors.dim, 'Creating template files...');

    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    const productMdPath = path.join(targetDir, 'PRODUCT.md');

    if (!fs.existsSync(claudeMdPath)) {
      fs.copyFileSync(
        path.join(TEMPLATE_DIR, 'CLAUDE.md'),
        claudeMdPath
      );
      log(colors.green, '  ✓ Created CLAUDE.md');
    } else {
      log(colors.dim, '  ⊙ CLAUDE.md already exists, skipping');
    }

    if (!fs.existsSync(productMdPath)) {
      fs.copyFileSync(
        path.join(TEMPLATE_DIR, 'PRODUCT.md'),
        productMdPath
      );
      log(colors.green, '  ✓ Created PRODUCT.md');
    } else {
      log(colors.dim, '  ⊙ PRODUCT.md already exists, skipping');
    }
  }

  // Update .gitignore
  checkGitignore();

  // Done!
  console.log('');
  log(colors.green, '✅ Agentful initialized successfully!');
  console.log('');
  log(colors.bright, 'Next steps:');
  console.log('');
  console.log(`  1. ${colors.cyan}Edit PRODUCT.md${colors.reset} with your product specification`);
  console.log(`  2. ${colors.cyan}Run: claude${colors.reset}`);
  console.log(`  3. ${colors.cyan}Type: /agentful-start${colors.reset}`);
  console.log('');
  log(colors.dim, 'For autonomous 24/7 development:');
  log(colors.cyan, `  /ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"`);
  console.log('');
}

function showStatus() {
  const agentfulDir = path.join(process.cwd(), '.agentful');

  if (!fs.existsSync(agentfulDir)) {
    log(colors.red, '❌ Agentful not initialized in this directory!');
    log(colors.dim, 'Run: npx agentful init');
    process.exit(1);
  }

  const statePath = path.join(agentfulDir, 'state.json');
  const completionPath = path.join(agentfulDir, 'completion.json');
  const decisionsPath = path.join(agentfulDir, 'decisions.json');

  if (!fs.existsSync(statePath)) {
    log(colors.red, '❌ State file missing!');
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  const completion = fs.existsSync(completionPath)
    ? JSON.parse(fs.readFileSync(completionPath, 'utf-8'))
    : null;
  const decisions = fs.existsSync(decisionsPath)
    ? JSON.parse(fs.readFileSync(decisionsPath, 'utf-8'))
    : null;

  showBanner();

  log(colors.bright, 'Current Status:');
  console.log('');

  // Show current work
  if (state.current_task) {
    log(colors.blue, `🔧 Working on: ${colors.reset}${state.current_task}`);
    log(colors.dim, `   Phase: ${state.current_phase}`);
    log(colors.dim, `   Iterations: ${state.iterations}`);
  } else {
    log(colors.dim, '💤 Idle - no active task');
  }

  console.log('');

  // Show completion if available
  if (completion) {
    const percentage = completion.overall || 0;
    const filled = Math.round(percentage / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);

    log(colors.bright, 'Progress:');
    log(colors.cyan, `   ${bar} ${percentage}%`);
    console.log('');

    // Show quality gates
    if (completion.gates) {
      log(colors.bright, 'Quality Gates:');
      Object.entries(completion.gates).forEach(([gate, passed]) => {
        const icon = passed ? '✅' : '❌';
        const label = gate.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        log(passed ? colors.green : colors.red, `   ${icon} ${label}`);
      });
      console.log('');
    }

    // Show pending decisions
    if (decisions && decisions.pending && decisions.pending.length > 0) {
      log(colors.yellow, `⚠️  ${decisions.pending.length} pending decisions:`);
      decisions.pending.forEach((d, i) => {
        log(colors.dim, `   ${i + 1}. ${d.question}`);
      });
      console.log('');
      log(colors.cyan, `   Run: /agentful-decide`);
      console.log('');
    }
  }

  // Show next action
  log(colors.bright, 'Next Actions:');
  log(colors.cyan, '   • /agentful-start    - Continue development');
  log(colors.cyan, '   • /agentful-decide  - Answer pending decisions');
  log(colors.cyan, '   • /agentful-validate- Run quality checks');
  console.log('');
}

function detectTechStack() {
  const targetDir = process.cwd();
  const detected = {
    language: null,
    framework: null,
    dependencies: [],
    devDependencies: []
  };

  // Check for package.json (Node.js/JavaScript/TypeScript)
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      detected.dependencies = Object.keys(pkg.dependencies || {});
      detected.devDependencies = Object.keys(pkg.devDependencies || {});
      detected.language = pkg.type === 'module' ? 'TypeScript/ESM' : 'JavaScript/TypeScript';

      // Detect framework
      if (detected.dependencies.includes('next')) {
        detected.framework = 'Next.js';
      } else if (detected.dependencies.includes('react')) {
        detected.framework = 'React';
      } else if (detected.dependencies.includes('vue')) {
        detected.framework = 'Vue';
      } else if (detected.dependencies.includes('express')) {
        detected.framework = 'Express';
      } else if (detected.dependencies.includes('nestjs')) {
        detected.framework = 'NestJS';
      }
    } catch (err) {
      log(colors.yellow, '⚠️  Could not parse package.json');
    }
  }

  // Check for requirements.txt or pyproject.toml (Python)
  const requirementsPath = path.join(targetDir, 'requirements.txt');
  const pyprojectPath = path.join(targetDir, 'pyproject.toml');
  if (fs.existsSync(requirementsPath) || fs.existsSync(pyprojectPath)) {
    detected.language = 'Python';
    const requirements = fs.existsSync(requirementsPath)
      ? fs.readFileSync(requirementsPath, 'utf-8')
      : '';
    if (requirements.includes('django')) detected.framework = 'Django';
    else if (requirements.includes('flask')) detected.framework = 'Flask';
    else if (requirements.includes('fastapi')) detected.framework = 'FastAPI';
  }

  // Check for go.mod (Go)
  if (fs.existsSync(path.join(targetDir, 'go.mod'))) {
    detected.language = 'Go';
    detected.framework = 'Standard Library';
  }

  // Check for Cargo.toml (Rust)
  if (fs.existsSync(path.join(targetDir, 'Cargo.toml'))) {
    detected.language = 'Rust';
  }

  // Check for .csproj or .fsproj (C#/.NET)
  const csprojFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.csproj'));
  if (csprojFiles.length > 0) {
    detected.language = 'C#';
    detected.framework = 'ASP.NET';
  }

  // Check for pom.xml (Java)
  if (fs.existsSync(path.join(targetDir, 'pom.xml'))) {
    detected.language = 'Java';
    detected.framework = 'Maven';
  }

  return detected;
}

function generateAgentPrompt(stack) {
  let prompt = `# Tech Stack Analysis\n\n`;
  prompt += `**Language**: ${stack.language || 'Unknown'}\n`;
  prompt += `**Framework**: ${stack.framework || 'None'}\n\n`;

  if (stack.dependencies.length > 0) {
    prompt += `**Key Dependencies**:\n`;
    stack.dependencies.slice(0, 10).forEach(dep => {
      prompt += `- ${dep}\n`;
    });
    prompt += `\n`;
  }

  prompt += `## Instructions\n\n`;
  prompt += `You are the Architect agent. Your task is to:\n\n`;
  prompt += `1. **Sample 3-5 files** from the codebase to understand patterns\n`;
  prompt += `2. **Detect conventions**: file structure, naming, imports, styling\n`;
  prompt += `3. **Generate specialized agents** with real examples from the code\n\n`;
  prompt += `## Output\n\n`;
  prompt += `Create/update \`.agentful/architecture.json\` with:\n`;
  prompt += `- Detected patterns\n`;
  prompt += `- Generated agent list\n`;
  prompt += `- Key conventions\n\n`;
  prompt += `Then create project-specific agent files in \`.claude/agents/\` \n`;
  prompt += `using the naming convention: \`[tech]-specialist.md\`\n\n`;

  prompt += `## Example Agent Template\n\n`;
  prompt += `\`\`\`markdown\n`;
  prompt += `# [Tech] Specialist Agent\n\n`;
  prompt += `---\n`;
  prompt += `name: [tech]-specialist\n`;
  prompt += `description: Expert in [Tech] development patterns\n`;
  prompt += `model: sonnet\n\n`;
  prompt += `## Context\n\n`;
  prompt += `[Analyze actual code samples and list real patterns]\n\n`;
  prompt += `## Conventions\n\n`;
  prompt += `1. [Pattern from actual code]\n`;
  prompt += `2. [Pattern from actual code]\n`;
  prompt += `3. [Pattern from actual code]\n\n`;
  prompt += `## Examples from Codebase\n\n`;
  prompt += `\`\`\`[language]\n`;
  prompt += `[Real example from sampled files]\n`;
  prompt += `\`\`\`\n`;
  prompt += `\`\`\`\n\n`;

  prompt += `---\n\n`;
  prompt += `**IMPORTANT**: \n`;
  prompt += `- Sample REAL files, don't make up patterns\n`;
  prompt += `- Include ACTUAL code examples from this project\n`;
  prompt += `- Respect existing conventions, don't introduce new ones\n`;
  prompt += `- Generate agents ONLY for technologies actually in use\n`;

  return prompt;
}

async function generateAgents() {
  showBanner();

  const agentfulDir = path.join(process.cwd(), '.agentful');

  // Check if Agentful is initialized
  if (!fs.existsSync(agentfulDir)) {
    log(colors.red, '❌ Agentful not initialized in this directory!');
    log(colors.dim, 'Run: npx agentful init');
    process.exit(1);
  }

  // Detect tech stack
  log(colors.dim, 'Analyzing tech stack...');
  const stack = detectTechStack();

  if (!stack.language) {
    log(colors.yellow, '⚠️  Could not detect language/framework');
    log(colors.dim, 'Supported: Node.js, Python, Go, Rust, C#, Java');
    console.log('');
    log(colors.cyan, 'Manually trigger architect analysis by running:');
    log(colors.cyan, '  claude');
    log(colors.cyan, '  Then invoke the architect agent');
    console.log('');
    return;
  }

  log(colors.green, `✓ Detected: ${stack.language} ${stack.framework ? `(${stack.framework})` : ''}`);
  log(colors.dim, `   Dependencies: ${stack.dependencies.length} packages`);

  // Update architecture.json
  log(colors.dim, 'Updating architecture analysis...');
  const archPath = path.join(agentfulDir, 'architecture.json');
  let architecture = { detected_stack: {}, generated_agents: [], decisions: [], timestamp: new Date().toISOString() };

  if (fs.existsSync(archPath)) {
    architecture = JSON.parse(fs.readFileSync(archPath, 'utf-8'));
  }

  architecture.detected_stack = stack;
  architecture.timestamp = new Date().toISOString();

  fs.writeFileSync(archPath, JSON.stringify(architecture, null, 2));

  console.log('');
  log(colors.bright, 'Tech Stack Analysis Complete!');
  console.log('');

  log(colors.bright, 'Detected Stack:');
  if (stack.language) log(colors.cyan, `  Language:    ${stack.language}`);
  if (stack.framework) log(colors.cyan, `  Framework:   ${stack.framework}`);
  if (stack.dependencies.length > 0) {
    log(colors.cyan, `  Dependencies: ${stack.dependencies.length} packages`);
  }
  console.log('');

  log(colors.bright, 'Next Steps:');
  console.log('');
  log(colors.cyan, '  1. Review .agentful/architecture.json');
  log(colors.cyan, '  2. Run: claude');
  log(colors.cyan, '  3. Type: /agentful-start');
  log(colors.cyan, '     (Architect agent will generate specialized agents automatically)');
  console.log('');

  log(colors.dim, '💡 Tip: Architect generates project-specific agents on first /agentful-start run');
  console.log('');
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'init':
      await initAgentful({ bare: args.includes('--bare') });
      break;

    case 'status':
      showStatus();
      break;

    case 'generate':
      await generateAgents();
      break;

    case '--help':
    case '-h':
    case 'help':
      showHelp();
      break;

    case '--version':
    case '-v':
      showVersion();
      break;

    default:
      if (!command || command.startsWith('-')) {
        showHelp();
      } else {
        log(colors.red, `Unknown command: ${command}`);
        log(colors.dim, 'Run: agentful --help');
        process.exit(1);
      }
  }
}

main().catch(err => {
  log(colors.red, 'Error:', err.message);
  process.exit(1);
});
