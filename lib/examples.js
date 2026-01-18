#!/usr/bin/env node

/**
 * Example usage of the agentful Analysis Engine
 *
 * This file demonstrates how to use the analysis engine
 * to understand a project's tech stack, domains, and patterns.
 */

import { analyzeProject, detectTechStack, detectDomains } from './index.js';
import path from 'path';

// Example 1: Full Project Analysis
async function exampleFullAnalysis() {
  console.log('═══ Example 1: Full Project Analysis ═══\n');

  const projectPath = process.cwd(); // Or specify a path
  const analysis = await analyzeProject(projectPath);

  console.log('Project Type:', analysis.projectType);
  console.log('Language:', analysis.language);
  console.log('Frameworks:', analysis.frameworks.join(', '));
  console.log('Structure:', analysis.structure);
  console.log('Confidence:', `${(analysis.confidence * 100).toFixed(0)}%`);

  if (analysis.domains.length > 0) {
    console.log('\nDetected Domains:');
    analysis.domains.forEach(domain => {
      const confidence = analysis.domainConfidence[domain];
      console.log(`  - ${domain} (${(confidence * 100).toFixed(0)}%)`);
    });
  }

  if (analysis.patterns.imports.length > 0) {
    console.log('\nImport Patterns:');
    analysis.patterns.imports.forEach(pattern => {
      console.log(`  - ${pattern}`);
    });
  }

  return analysis;
}

// Example 2: Tech Stack Detection Only
async function exampleTechStackDetection() {
  console.log('\n═══ Example 2: Tech Stack Detection ═══\n');

  const stack = await detectTechStack(process.cwd());

  console.log('Primary Language:', stack.primaryLanguage);
  console.log('All Languages:', stack.languages.join(', '));

  if (stack.frameworks.length > 0) {
    console.log('\nFrameworks:');
    stack.frameworks.forEach(fw => console.log(`  - ${fw}`));
  }

  if (stack.databases.length > 0) {
    console.log('\nDatabases:');
    stack.databases.forEach(db => console.log(`  - ${db}`));
  }

  if (stack.testingFrameworks.length > 0) {
    console.log('\nTesting:');
    stack.testingFrameworks.forEach(tf => console.log(`  - ${tf}`));
  }

  if (stack.styling.length > 0) {
    console.log('\nStyling:');
    stack.styling.forEach(style => console.log(`  - ${style}`));
  }

  console.log('\nBuild System:', stack.buildSystem);
  console.log('Package Manager:', stack.packageManager);

  return stack;
}

// Example 3: Domain Detection Only
async function exampleDomainDetection() {
  console.log('\n═══ Example 3: Domain Detection ═══\n');

  const result = await detectDomains(process.cwd());

  if (result.detected.length === 0) {
    console.log('No domains detected');
    return result;
  }

  console.log(`Detected ${result.detected.length} domains:\n`);

  result.detected.forEach((domain, index) => {
    const confidence = result.confidence[domain];
    const bar = '█'.repeat(Math.round(confidence * 20));
    console.log(`${index + 1}. ${domain}`);
    console.log(`   ${bar} ${(confidence * 100).toFixed(0)}%`);
  });

  console.log(`\nOverall confidence: ${(result.totalConfidence * 100).toFixed(0)}%`);

  return result;
}

// Example 4: Analyzing a Different Project
async function exampleAnalyzeDifferentProject() {
  console.log('\n═══ Example 4: Analyzing Different Project ═══\n');

  // Specify a different project path
  const otherProjectPath = path.join(process.cwd(), '..', 'other-project');

  try {
    const analysis = await analyzeProject(otherProjectPath);
    console.log('Analyzed:', otherProjectPath);
    console.log('Language:', analysis.language);
    console.log('Frameworks:', analysis.frameworks.join(', '));
  } catch (error) {
    console.log('Could not analyze project:', error.message);
  }
}

// Example 5: Using Analysis for Decision Making
async function exampleDecisionMaking() {
  console.log('\n═══ Example 5: Decision Making ═══\n');

  const analysis = await analyzeProject(process.cwd());

  // Make decisions based on analysis
  const decisions = [];

  // Choose testing framework
  if (analysis.testingFrameworks.length === 0) {
    if (analysis.language === 'TypeScript' || analysis.language === 'JavaScript') {
      decisions.push('Add Vitest for testing');
    } else if (analysis.language === 'Python') {
      decisions.push('Add PyTest for testing');
    }
  }

  // Choose styling approach
  if (analysis.styling.length === 0) {
    if (analysis.frameworks.includes('Next.js') || analysis.frameworks.includes('React')) {
      decisions.push('Consider adding Tailwind CSS for styling');
    }
  }

  // Check for documentation
  if (!analysis.hasDocs) {
    decisions.push('Add documentation directory');
  }

  // Check for testing
  if (!analysis.hasTests) {
    decisions.push('Add test directory and tests');
  }

  if (decisions.length > 0) {
    console.log('Recommendations:\n');
    decisions.forEach((decision, index) => {
      console.log(`${index + 1}. ${decision}`);
    });
  } else {
    console.log('No specific recommendations - project looks good!');
  }

  return decisions;
}

// Example 6: Comparing Two Projects
async function exampleCompareProjects() {
  console.log('\n═══ Example 6: Comparing Projects ═══\n');

  // This would compare two different projects
  // For demonstration, we'll just show the structure

  console.log('To compare two projects:');
  console.log('1. Analyze project A: const analysisA = await analyzeProject(pathA)');
  console.log('2. Analyze project B: const analysisB = await analyzeProject(pathB)');
  console.log('3. Compare properties:');
  console.log('   - Languages: analysisA.language vs analysisB.language');
  console.log('   - Frameworks: analysisA.frameworks vs analysisB.frameworks');
  console.log('   - Domains: analysisA.domains vs analysisB.domains');
  console.log('   - Patterns: analysisA.patterns vs analysisB.patterns');
}

// Example 7: Generating Agent Prompts
async function exampleGenerateAgentPrompts() {
  console.log('\n═══ Example 7: Generating Agent Prompts ═══\n');

  const analysis = await analyzeProject(process.cwd());

  // Generate a prompt for a framework-specific agent
  const framework = analysis.frameworks[0];

  if (framework) {
    const prompt = `
# ${framework} Specialist Agent

## Project Context

This is a ${analysis.projectType} built with:
- Language: ${analysis.language}
- Framework: ${framework}
- Build System: ${analysis.buildSystem}
- Package Manager: ${analysis.packageManager}

## Detected Patterns

${Object.entries(analysis.patterns).map(([category, patterns]) =>
  `### ${category}\n${Array.isArray(patterns) && patterns.length > 0 ? patterns.map(p => `- ${p}`).join('\n') : 'None detected'}`
).join('\n\n')}

## Conventions

- File Organization: ${analysis.conventions.fileOrganization}
- Import Style: ${analysis.conventions.importStyle.join(', ')}
- Code Style: ${analysis.conventions.codeStyle.join(', ')}

## Business Domains

${analysis.domains.map(d => `- ${d} (${(analysis.domainConfidence[d] * 100).toFixed(0)}%)`).join('\n')}

## Instructions

When implementing features:
1. Follow the detected patterns above
2. Match the existing code style
3. Use the same import style
4. Respect the file organization
5. Consider the business domains
`;

    console.log('Generated agent prompt:');
    console.log(prompt);
  }

  return prompt;
}

// Example 8: Error Handling
async function exampleErrorHandling() {
  console.log('\n═══ Example 8: Error Handling ═══\n');

  // Try to analyze a non-existent project
  const fakePath = '/path/to/nonexistent/project';

  try {
    const analysis = await analyzeProject(fakePath);
    console.log('Analysis result:', analysis);

    // Check for partial analysis
    if (analysis.partial) {
      console.log('Got partial analysis due to errors');
      console.log('Warnings:', analysis.warnings);
    }
  } catch (error) {
    console.log('Analysis failed:', error.message);
  }
}

// Main function to run all examples
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       agentful Analysis Engine - Usage Examples              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log('Current project:', process.cwd());
  console.log('Running examples...\n');

  try {
    // Run examples
    await exampleFullAnalysis();
    await exampleTechStackDetection();
    await exampleDomainDetection();
    await exampleDecisionMaking();
    await exampleGenerateAgentPrompts();
    await exampleCompareProjects();
    await exampleErrorHandling();

    console.log('\n═══ All Examples Complete ═══');
    console.log('\nYou can use these patterns in your own code!');
  } catch (error) {
    console.error('\nError running examples:', error.message);
    console.error(error);
  }
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export {
  exampleFullAnalysis,
  exampleTechStackDetection,
  exampleDomainDetection,
  exampleAnalyzeDifferentProject,
  exampleDecisionMaking,
  exampleCompareProjects,
  exampleGenerateAgentPrompts,
  exampleErrorHandling
};
