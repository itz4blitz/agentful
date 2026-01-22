#!/usr/bin/env node

/**
 * Agent Generator Example
 *
 * Demonstrates how to use the agent generator system to create
 * specialized agents from architecture analysis.
 *
 * Usage:
 *   node examples/generator-example.js
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';
import { AgentGenerator } from '../lib/core/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

async function main() {
  console.log('🤖 Agent Generator Example\n');

  // Step 1: Setup test environment
  console.log('📦 Setting up test environment...');
  const testDir = path.join(projectRoot, '.test-generator');
  await fs.mkdir(testDir, { recursive: true });

  // Copy sample architecture.json
  const sampleArch = path.join(__dirname, 'sample-architecture.json');
  const testArch = path.join(testDir, '.agentful', 'architecture.json');
  await fs.mkdir(path.dirname(testArch), { recursive: true });
  await fs.copyFile(sampleArch, testArch);
  console.log('✅ Test environment ready\n');

  // Step 2: Initialize generator
  console.log('🔧 Initializing agent generator...');
  const generator = new AgentGenerator(testDir, {
    templateDir: path.join(projectRoot, 'templates')
  });

  await generator.initialize();
  console.log('✅ Generator initialized\n');

  // Step 3: Generate agents
  console.log('⚙️  Generating agents...');
  const startTime = Date.now();

  const result = await generator.generateAgents();

  const duration = Date.now() - startTime;
  console.log(`✅ Generated ${result.generated} agents in ${duration}ms\n`);

  // Step 4: Display results
  console.log('📊 Generation Results:');
  console.log(`   Total Agents: ${result.generated}`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   Performance: ${result.performance}\n`);

  console.log('📝 Generated Agents:');
  for (const agent of result.agents) {
    console.log(`   - ${agent.metadata.name} (${agent.metadata.version})`);
    console.log(`     Template: ${agent.metadata.template}`);
    console.log(`     Checksum: ${agent.metadata.checksum}`);
    console.log(`     Size: ${agent.content.length} bytes`);
    console.log();
  }

  // Step 5: Show sample agent content
  const sampleAgent = result.agents.find(a => a.metadata.name === 'backend');
  if (sampleAgent) {
    console.log('📄 Sample Generated Agent (backend):\n');
    console.log('─'.repeat(80));
    console.log(sampleAgent.content.substring(0, 800) + '...\n');
    console.log('─'.repeat(80));
  }

  // Step 6: Verify files were saved
  console.log('\n📁 Checking saved files...');
  const agentsDir = path.join(testDir, '.agentful', 'agents', 'generated');
  const savedFiles = await fs.readdir(agentsDir);
  console.log(`   Found ${savedFiles.length} files in ${agentsDir}`);
  console.log(`   Files: ${savedFiles.join(', ')}\n`);

  // Step 7: Cleanup
  console.log('🧹 Cleaning up test environment...');
  await fs.rm(testDir, { recursive: true, force: true });
  console.log('✅ Cleanup complete\n');

  console.log('✨ Example completed successfully!');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
