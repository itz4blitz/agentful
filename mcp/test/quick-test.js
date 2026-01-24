#!/usr/bin/env node

/**
 * Quick MCP Server Test
 * Tests the server responds to basic MCP protocol messages
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '../bin/mcp-server.js');

console.log('🧪 Testing agentful MCP Server...\n');

// Start the server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '../../') // Project root
});

let responseBuffer = '';
let testsPassed = 0;
let testsFailed = 0;

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse JSON-RPC responses
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const response = JSON.parse(line);
      if (response.jsonrpc === '2.0') {
        console.log(`✅ Received response for request ID ${response.id}`);
        if (response.result) {
          testsPassed++;
          if (response.result.tools) {
            console.log(`   📋 Tools: ${response.result.tools.length} available`);
          }
          if (response.result.resources) {
            console.log(`   📦 Resources: ${response.result.resources.length} available`);
          }
        }
        if (response.error) {
          testsFailed++;
          console.log(`   ❌ Error: ${response.error.message}`);
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  responseBuffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('[agentful-mcp]') || msg.includes('level')) {
    // Server logs - ignore for clarity
  } else {
    console.error('⚠️  Server error:', msg);
  }
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

// Give server time to start
setTimeout(() => {
  console.log('📤 Sending test requests...\n');

  // Test 1: Initialize
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'quick-test', version: '1.0.0' }
    }
  };
  server.stdin.write(JSON.stringify(initRequest) + '\n');

  setTimeout(() => {
    // Test 2: List tools
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    server.stdin.write(JSON.stringify(toolsRequest) + '\n');

    setTimeout(() => {
      // Test 3: List resources
      const resourcesRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/list',
        params: {}
      };
      server.stdin.write(JSON.stringify(resourcesRequest) + '\n');

      setTimeout(() => {
        // Test 4: Read a resource
        const readRequest = {
          jsonrpc: '2.0',
          id: 4,
          method: 'resources/read',
          params: { uri: 'agentful://state/current' }
        };
        server.stdin.write(JSON.stringify(readRequest) + '\n');

        // Wait for responses, then exit
        setTimeout(() => {
          server.kill();

          console.log('\n' + '='.repeat(50));
          console.log(`✅ Tests passed: ${testsPassed}`);
          console.log(`❌ Tests failed: ${testsFailed}`);
          console.log('='.repeat(50));

          process.exit(testsFailed > 0 ? 1 : 0);
        }, 1000);
      }, 500);
    }, 500);
  }, 500);
}, 1000);
