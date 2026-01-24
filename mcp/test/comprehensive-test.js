#!/usr/bin/env node

/**
 * Comprehensive MCP Server Test
 * Tests all tools and resources
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '../bin/mcp-server.js');

console.log('🧪 Comprehensive MCP Server Test\n');
console.log('='.repeat(60));

// Start the server
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: path.join(__dirname, '../../')
});

let responseBuffer = '';
let requestId = 0;
const pendingRequests = new Map();
let testResults = { passed: 0, failed: 0, tests: [] };

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const response = JSON.parse(line);
      if (response.jsonrpc === '2.0' && pendingRequests.has(response.id)) {
        const test = pendingRequests.get(response.id);
        pendingRequests.delete(response.id);

        if (response.error) {
          test.result = 'FAIL';
          test.error = response.error.message;
          testResults.failed++;
          console.log(`❌ ${test.name}: ${response.error.message}`);
        } else {
          test.result = 'PASS';
          test.response = response.result;
          testResults.passed++;
          console.log(`✅ ${test.name}`);
        }
        testResults.tests.push(test);
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
  responseBuffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  // Suppress server logs for clarity
});

function sendRequest(method, params, name) {
  requestId++;
  const id = requestId;
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params: params || {}
  };

  pendingRequests.set(id, { name, method, params });
  server.stdin.write(JSON.stringify(request) + '\n');
}

// Wait for server to start
setTimeout(() => {
  console.log('\n📋 Testing Protocol Operations...\n');

  // Initialize
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'comprehensive-test', version: '1.0.0' }
  }, 'Initialize');

  setTimeout(() => {
    console.log('\n📦 Testing Resources...\n');

    // List resources
    sendRequest('resources/list', {}, 'List Resources');

    // Read resources
    setTimeout(() => {
      const resources = [
        'agentful://product/spec',
        'agentful://state/current',
        'agentful://completion',
        'agentful://decisions',
        'agentful://agents/list'
      ];

      resources.forEach((uri, i) => {
        setTimeout(() => {
          sendRequest('resources/read', { uri }, `Read: ${uri}`);
        }, i * 100);
      });

      setTimeout(() => {
        console.log('\n🛠️  Testing Tools...\n');

        // List tools
        sendRequest('tools/list', {}, 'List Tools');

        setTimeout(() => {
          // Test get_status (no params required)
          sendRequest('tools/call', {
            name: 'get_status',
            arguments: {}
          }, 'Tool: get_status');

          // Test analyze_architecture
          setTimeout(() => {
            sendRequest('tools/call', {
              name: 'analyze_architecture',
              arguments: { depth: 1 }
            }, 'Tool: analyze_architecture (depth=1)');

            // Wait for all responses
            setTimeout(() => {
              server.kill();

              console.log('\n' + '='.repeat(60));
              console.log('📊 Test Results');
              console.log('='.repeat(60));
              console.log(`✅ Passed: ${testResults.passed}`);
              console.log(`❌ Failed: ${testResults.failed}`);
              console.log(`📈 Total:  ${testResults.passed + testResults.failed}`);
              console.log('='.repeat(60));

              if (testResults.failed > 0) {
                console.log('\n❌ Failed Tests:');
                testResults.tests
                  .filter(t => t.result === 'FAIL')
                  .forEach(t => {
                    console.log(`   - ${t.name}: ${t.error}`);
                  });
              }

              console.log('\n✨ MCP Server is functional!\n');
              process.exit(testResults.failed > 0 ? 1 : 0);
            }, 2000);
          }, 500);
        }, 500);
      }, resources.length * 100 + 500);
    }, 500);
  }, 500);
}, 1000);

// Timeout safety
setTimeout(() => {
  console.error('\n⏰ Test timeout - killing server');
  server.kill();
  process.exit(1);
}, 15000);
