#!/usr/bin/env node

/**
 * agentful CLI
 * An opinionated autonomous product development kit for Claude Code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeProject, exportToArchitectureJson } from '../lib/project-analyzer.js';
import AgentGenerator from '../lib/agent-generator.js';
import DomainStructureGenerator from '../lib/domain-structure-generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version from centralized config
const VERSION = JSON.parse(fs.readFileSync(path.join(__dirname, '../version.json'), 'utf-8')).version;
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
  console.log(`  ${colors.green}init${colors.reset}         Initialize agentful in current directory`);
  console.log(`  ${colors.green}init --bare${colors.reset}  Skip creating templates (just .claude/)`);
  console.log(`  ${colors.green}init --no-smart${colors.reset} Skip smart analysis (basic init only)`);
  console.log(`  ${colors.green}init --deep${colors.reset}  Run deep analysis (slower, more thorough)`);
  console.log(`  ${colors.green}init --generate-agents${colors.reset}  Auto-generate agents`);
  console.log(`  ${colors.green}init --generate-domains${colors.reset} Auto-generate domain structure`);
  console.log(`  ${colors.green}generate${colors.reset}     Generate specialized agents from tech stack`);
  console.log(`  ${colors.green}status${colors.reset}       Show current development progress`);
  console.log(`  ${colors.green}--help${colors.reset}       Show this help message`);
  console.log(`  ${colors.green}--version${colors.reset}    Show version`);
  console.log('');
  console.log('AFTER INIT:');
  console.log(`  1. ${colors.bright}agentful automatically detects the best structure:${colors.reset}`);
  console.log(`     ${colors.green}• Small projects:${colors.reset} Creates PRODUCT.md (simple, flat structure)`);
  console.log(`     ${colors.cyan}• Large/complex projects:${colors.reset} Creates .claude/product/ with domains`);
  console.log(`     ${colors.dim}(Detection based on: # of domains, frameworks, monorepo status)${colors.reset}`);
  console.log(`  2. ${colors.bright}Edit your product specification${colors.reset}`);
  console.log(`  3. Run ${colors.bright}claude${colors.reset} to start Claude Code`);
  console.log(`  4. Type ${colors.bright}/agentful${colors.reset} for natural conversation or ${colors.bright}/agentful-start${colors.reset} for autonomous development`);
  console.log('');
  console.log('FOR 24/7 DEVELOPMENT:');
  console.log(`  ${colors.cyan}/ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"${colors.reset}`);
  console.log('');
}

function showVersion() {
  console.log(`agentful v${VERSION}`);
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

  const agentfulIgnore = '# agentful runtime state\n.agentful/\n';

  if (!content.includes('.agentful/')) {
    fs.appendFileSync(gitignorePath, agentfulIgnore);
    log(colors.dim, 'Added .agentful/ to .gitignore');
  }
}

async function initagentful(options = {}) {
  showBanner();

  const targetDir = process.cwd();
  const claudeDir = path.join(targetDir, '.claude');
  const agentfulDir = path.join(targetDir, '.agentful');

  // Parse options
  const bare = options.bare || false;
  const smart = options.smart !== false; // Default: true
  const deep = options.deep || false;
  const autoGenerateAgents = options.generateAgents || false;
  const autoGenerateDomains = options.generateDomains || false;

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
  if (!bare) {
    log(colors.dim, 'Creating template files...');

    const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
    const productMdPath = path.join(targetDir, 'PRODUCT.md');
    const claudeProductDir = path.join(targetDir, '.claude/product');

    if (!fs.existsSync(claudeMdPath)) {
      fs.copyFileSync(
        path.join(TEMPLATE_DIR, 'CLAUDE.md'),
        claudeMdPath
      );
      log(colors.green, '  ✓ Created CLAUDE.md');
    } else {
      log(colors.dim, '  ⊙ CLAUDE.md already exists, skipping');
    }

    // Determine if project should use hierarchical structure
    const shouldUseHierarchical = analysis && (
      analysis.domains.length >= 3 ||  // Multiple detected domains
      (analysis.frameworks && analysis.frameworks.length >= 2) ||  // Multiple frameworks
      (analysis.packageManager === 'workspace' || analysis.packageManager === 'monorepo')  // Monorepo
    );

    // Create appropriate product structure
    const productExists = fs.existsSync(productMdPath) || fs.existsSync(claudeProductDir);

    if (!productExists) {
      if (shouldUseHierarchical) {
        // Create hierarchical .claude/product/ structure
        log(colors.dim, '  📁 Using hierarchical product structure (detected complex project)');
        fs.mkdirSync(claudeProductDir, { recursive: true });
        fs.mkdirSync(path.join(claudeProductDir, 'domains'), { recursive: true });

        // Create main index.md
        const indexContent = `# Product Specification

## Overview
[Describe your product here]

## Tech Stack
${analysis && analysis.language ? `- Language: ${analysis.language}` : ''}
${analysis && analysis.frameworks && analysis.frameworks.length > 0 ? `- Frameworks: ${analysis.frameworks.join(', ')}` : ''}
${analysis && analysis.packageManager && analysis.packageManager !== 'unknown' ? `- Package Manager: ${analysis.packageManager}` : ''}

## Domains
${analysis && analysis.domains.length > 0 ? analysis.domains.map((d, i) => `${i + 1}. [${d}] - Define details in \`domains/${d.toLowerCase().replace(/\s+/g, '-')}/index.md\``).join('\n') : '- [Domain 1] - Define in domains/domain-name/index.md\n- [Domain 2] - Define in domains/domain-name/index.md'}

## Priority Legend
- **CRITICAL**: Must have for launch
- **HIGH**: Important for MVP
- **MEDIUM**: Nice to have
- **LOW**: Future consideration
`;

        fs.writeFileSync(path.join(claudeProductDir, 'index.md'), indexContent);

        // Create domain directories with index files for detected domains
        if (analysis && analysis.domains.length > 0) {
          analysis.domains.slice(0, 8).forEach(domain => {
            const domainDir = path.join(claudeProductDir, 'domains', domain.toLowerCase().replace(/\s+/g, '-'));
            fs.mkdirSync(domainDir, { recursive: true });

            const domainIndexContent = `# ${domain} Domain

## Overview
[Describe the ${domain} domain's purpose and scope]

## Features
1. [Feature 1] (CRITICAL)
   - [Acceptance criteria]
   - [Dependencies]

2. [Feature 2] (HIGH)
   - [Acceptance criteria]

## Technical Notes
- [Any technical considerations specific to this domain]
`;
            fs.writeFileSync(path.join(domainDir, 'index.md'), domainIndexContent);
          });
        } else {
          // Create example domain structure
          const exampleDomainDir = path.join(claudeProductDir, 'domains', 'example-domain');
          fs.mkdirSync(exampleDomainDir, { recursive: true });
          fs.writeFileSync(
            path.join(exampleDomainDir, 'index.md'),
            '# Example Domain\n\n## Overview\n[Describe this domain]\n\n## Features\n1. Example Feature (HIGH)\n'
          );
        }

        log(colors.green, '  ✓ Created .claude/product/ with domain structure');
        log(colors.dim, `     → Organized by ${analysis.domains.length > 0 ? analysis.domains.length : 'example'} domain(s)`);
      } else {
        // Create flat PRODUCT.md structure
        log(colors.dim, '  📄 Using flat product structure (simple project)');
        fs.copyFileSync(
          path.join(TEMPLATE_DIR, 'PRODUCT.md'),
          productMdPath
        );
        log(colors.green, '  ✓ Created PRODUCT.md');
      }
    } else {
      log(colors.dim, '  ⊙ Product spec already exists, skipping');
    }
  }

  // Update .gitignore
  checkGitignore();

  // Perform smart project analysis (unless explicitly disabled)
  let analysis = null;
  if (smart) {
    console.log('');
    log(colors.bright, '🔍 Analyzing your project...');
    console.log('');

    try {
      const startTime = Date.now();
      analysis = await analyzeProject(targetDir);
      await exportToArchitectureJson(targetDir, analysis);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Show detected tech stack
      if (analysis.language && analysis.language !== 'unknown') {
        log(colors.cyan, `  Language:    ${analysis.language}`);
        if (analysis.primaryLanguage && analysis.primaryLanguage !== analysis.language) {
          log(colors.dim, `  Primary:     ${analysis.primaryLanguage}`);
        }
      }

      if (analysis.frameworks.length > 0) {
        log(colors.cyan, `  Frameworks:  ${analysis.frameworks.join(', ')}`);
      }

      if (analysis.packageManager && analysis.packageManager !== 'unknown') {
        log(colors.cyan, `  Package Mgr: ${analysis.packageManager}`);
      }

      if (analysis.buildSystem && analysis.buildSystem !== 'unknown') {
        log(colors.cyan, `  Build:       ${analysis.buildSystem}`);
      }

      console.log('');

      // Show detected domains
      if (analysis.domains.length > 0) {
        log(colors.bright, '📊 Detected domains:');
        console.log('');

        analysis.domains.slice(0, 5).forEach(domain => {
          const confidence = analysis.domainConfidence[domain] || 0.5;
          const confidenceBar = '█'.repeat(Math.round(confidence * 10)) + '░'.repeat(10 - Math.round(confidence * 10));
          const confidencePct = Math.round(confidence * 100);

          // Color code based on confidence
          let confidenceColor = colors.red;
          if (confidence >= 0.8) confidenceColor = colors.green;
          else if (confidence >= 0.5) confidenceColor = colors.yellow;

          log(confidenceColor, `  • ${domain.padEnd(20)} ${confidenceBar} ${confidencePct}%`);
        });

        if (analysis.domains.length > 5) {
          log(colors.dim, `  ... and ${analysis.domains.length - 5} more`);
        }

        console.log('');
      }

      log(colors.dim, `  Analysis completed in ${duration}s (${Math.round(analysis.confidence * 100)}% confidence)`);

      // Show warnings if any
      if (analysis.warnings && analysis.warnings.length > 0) {
        console.log('');
        log(colors.yellow, '⚠️  Warnings:');
        analysis.warnings.slice(0, 3).forEach(warning => {
          log(colors.dim, `  • ${warning}`);
        });
      }

    } catch (error) {
      log(colors.dim, '  ⊙ Smart analysis skipped (project may be empty or unsupported)');
      log(colors.dim, `     Error: ${error.message}`);
      analysis = null;
    }
  }

  // Interactive prompts for generation (if not auto-generated)
  if (analysis && analysis.domains.length > 0 && !autoGenerateDomains && !autoGenerateAgents) {
    console.log('');
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Ask about domain structure
    const generateStructure = await new Promise(resolve => {
      rl.question(`✨ Generate domain structure and specialized agents? [Y/n] `, answer => {
        resolve(answer.toLowerCase() !== 'n');
      });
    });

    rl.close();

    if (generateStructure) {
      await generateAgentsAndDomains(targetDir, analysis);
    }
  } else if (autoGenerateDomains || autoGenerateAgents) {
    console.log('');
    log(colors.dim, '🤖 Generating agents and domain structure...');
    await generateAgentsAndDomains(targetDir, analysis, {
      agents: autoGenerateAgents,
      domains: autoGenerateDomains
    });
  }

  // Done!
  console.log('');
  log(colors.green, '✅ agentful initialized successfully!');
  console.log('');

  // Determine which structure was created
  const productMdPath = path.join(targetDir, 'PRODUCT.md');
  const claudeProductDir = path.join(targetDir, '.claude/product');
  const usingHierarchical = fs.existsSync(claudeProductDir);
  const usingFlat = fs.existsSync(productMdPath);

  log(colors.bright, 'Next steps:');
  console.log('');
  console.log(`  1. ${colors.cyan}Edit your product specification${colors.reset}`);

  if (usingHierarchical) {
    console.log(`     ${colors.green}✓ Created .claude/product/index.md${colors.reset} (hierarchical structure)`);
    console.log(`     ${colors.dim}→ Organized by domains (best for larger projects)${colors.reset}`);
    if (analysis && analysis.domains.length > 0) {
      console.log(`     ${colors.dim}→ Detected ${analysis.domains.length} domain(s) with pre-configured directories${colors.reset}`);
    }
  } else if (usingFlat) {
    console.log(`     ${colors.green}✓ Created PRODUCT.md${colors.reset} (flat structure)`);
    console.log(`     ${colors.dim}→ Simple, single-file format (best for small projects)${colors.reset}`);
  }

  console.log(`  2. ${colors.cyan}Run: claude${colors.reset}`);
  console.log(`  3. ${colors.cyan}Type: /agentful${colors.reset} (natural) or ${colors.cyan}/agentful-start${colors.reset} (autonomous)`);
  console.log('');

  if (usingHierarchical) {
    log(colors.dim, '💡 Hierarchical structure benefits:');
    log(colors.dim, '   • Organized by domain (e.g., Auth, Users, Billing)');
    log(colors.dim, '   • Easier to manage large feature sets');
    log(colors.dim, '   • Teams can work on different domains in parallel');
    console.log('');
  }

  log(colors.dim, 'For autonomous 24/7 development:');
  log(colors.cyan, `  /ralph-loop "/agentful-start" --max-iterations 50 --completion-promise "AGENTFUL_COMPLETE"`);
  console.log('');
}

/**
 * Generate agents and domain structure
 */
async function generateAgentsAndDomains(projectPath, analysis, options = {}) {
  const { agents = true, domains = true } = options;

  try {
    // Generate domain structure
    if (domains) {
      log(colors.dim, '📁 Creating domain structure...');
      const domainGenerator = new DomainStructureGenerator(projectPath, analysis);
      const domainResult = await domainGenerator.generateDomainStructure();
      log(colors.green, `  ✓ Generated ${domainResult.domains} domains with ${domainResult.features} features`);
    }

    // Generate specialized agents
    if (agents) {
      log(colors.dim, '🤖 Generating specialized agents...');
      const agentGenerator = new AgentGenerator(projectPath, analysis);
      const agentResult = await agentGenerator.generateAgents();

      const totalAgents = agentResult.core.length + agentResult.domains.length + agentResult.tech.length;
      log(colors.green, `  ✓ Generated ${totalAgents} agents:`);
      log(colors.dim, `     - ${agentResult.core.length} core agents`);
      if (agentResult.domains.length > 0) {
        log(colors.dim, `     - ${agentResult.domains.length} domain agents`);
      }
      if (agentResult.tech.length > 0) {
        log(colors.dim, `     - ${agentResult.tech.length} tech-specific agents`);
      }
    }

    console.log('');
    log(colors.green, '✨ Generation complete!');
    log(colors.dim, '  Your agents are now contextually aware of your codebase.');
  } catch (error) {
    log(colors.red, `❌ Generation failed: ${error.message}`);
    log(colors.dim, '  You can continue without it, or run: agentful generate');
  }
}

function showStatus() {
  const agentfulDir = path.join(process.cwd(), '.agentful');

  if (!fs.existsSync(agentfulDir)) {
    log(colors.red, '❌ agentful not initialized in this directory!');
    log(colors.dim, 'Run: npx @itz4blitz/agentful init');
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

  // Check if agentful is initialized
  if (!fs.existsSync(agentfulDir)) {
    log(colors.red, '❌ agentful not initialized in this directory!');
    log(colors.dim, 'Run: npx @itz4blitz/agentful init');
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
      // Parse init options
      const initOptions = {
        bare: args.includes('--bare'),
        smart: !args.includes('--no-smart'),
        deep: args.includes('--deep'),
        generateAgents: args.includes('--generate-agents'),
        generateDomains: args.includes('--generate-domains')
      };
      await initagentful(initOptions);
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
