#!/usr/bin/env node

/**
 * Agentful MCP Server - Main entrypoint
 *
 * Supports multiple transports:
 * - stdio (default for Claude Code, Kiro)
 * - HTTP (for network-based MCP clients)
 * - SSE (Server-Sent Events for streaming)
 */

import { parseArgs } from 'node:util';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read version
const versionPath = path.join(__dirname, '../../version.json');
const VERSION = JSON.parse(readFileSync(versionPath, 'utf-8')).version;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.error(color, ...args, colors.reset);
}

function showHelp() {
  console.error('');
  log(colors.cyan, 'Agentful MCP Server');
  log(colors.dim, `v${VERSION}`);
  console.error('');
  log(colors.bright, 'USAGE:');
  console.error(`  agentful-mcp [options]`);
  console.error('');
  log(colors.bright, 'OPTIONS:');
  console.error(`  ${colors.yellow}--transport=<mode>${colors.reset}    Transport mode: stdio|http|sse (default: stdio)`);
  console.error(`  ${colors.yellow}--port=<number>${colors.reset}       HTTP/SSE server port (default: 3838)`);
  console.error(`  ${colors.yellow}--host=<address>${colors.reset}      HTTP/SSE bind address (default: localhost)`);
  console.error(`  ${colors.yellow}--project-root=<path>${colors.reset} Project root directory (default: current dir)`);
  console.error(`  ${colors.yellow}--log-level=<level>${colors.reset}   Logging level: debug|info|warn|error (default: info)`);
  console.error(`  ${colors.yellow}--version, -v${colors.reset}         Show version`);
  console.error(`  ${colors.yellow}--help, -h${colors.reset}            Show this help`);
  console.error('');
  log(colors.bright, 'EXAMPLES:');
  console.error('');
  log(colors.dim, '  # Start stdio server (for Claude Code, Kiro)');
  console.error(`  ${colors.green}agentful-mcp${colors.reset}`);
  console.error('');
  log(colors.dim, '  # Start HTTP server');
  console.error(`  ${colors.green}agentful-mcp --transport=http --port=3838${colors.reset}`);
  console.error('');
  log(colors.dim, '  # Start with custom project root');
  console.error(`  ${colors.green}agentful-mcp --project-root=/path/to/project${colors.reset}`);
  console.error('');
  log(colors.bright, 'ENVIRONMENT VARIABLES:');
  console.error(`  ${colors.yellow}AGENTFUL_PROJECT_ROOT${colors.reset}  Project root directory`);
  console.error(`  ${colors.yellow}MCP_TRANSPORT${colors.reset}          Transport mode`);
  console.error(`  ${colors.yellow}LOG_LEVEL${colors.reset}              Logging level`);
  console.error('');
  log(colors.bright, 'CONFIGURATION:');
  console.error('  Add to Claude Code configuration:');
  console.error('');
  console.error('  {');
  console.error('    "mcpServers": {');
  console.error('      "agentful": {');
  console.error('        "command": "npx",');
  console.error('        "args": ["@itz4blitz/agentful-mcp"]');
  console.error('      }');
  console.error('    }');
  console.error('  }');
  console.error('');
}

async function main() {
  try {
    const { values } = parseArgs({
      options: {
        transport: {
          type: 'string',
          default: process.env.MCP_TRANSPORT || 'stdio',
        },
        port: {
          type: 'string',
          default: process.env.MCP_PORT || '3838',
        },
        host: {
          type: 'string',
          default: process.env.MCP_HOST || 'localhost',
        },
        'project-root': {
          type: 'string',
          default: process.env.AGENTFUL_PROJECT_ROOT || process.cwd(),
        },
        'log-level': {
          type: 'string',
          default: process.env.LOG_LEVEL || 'info',
        },
        version: {
          type: 'boolean',
          short: 'v',
        },
        help: {
          type: 'boolean',
          short: 'h',
        },
      },
      allowPositionals: false,
    });

    // Handle --version
    if (values.version) {
      console.log(`agentful-mcp v${VERSION}`);
      process.exit(0);
    }

    // Handle --help
    if (values.help) {
      showHelp();
      process.exit(0);
    }

    // Validate transport
    const validTransports = ['stdio', 'http', 'sse'];
    if (!validTransports.includes(values.transport)) {
      log(colors.red, `Invalid transport: ${values.transport}`);
      console.error('');
      log(colors.dim, `Valid transports: ${validTransports.join(', ')}`);
      process.exit(1);
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLogLevels.includes(values['log-level'])) {
      log(colors.red, `Invalid log level: ${values['log-level']}`);
      console.error('');
      log(colors.dim, `Valid levels: ${validLogLevels.join(', ')}`);
      process.exit(1);
    }

    // Build configuration
    const config = {
      transport: values.transport,
      port: parseInt(values.port, 10),
      host: values.host,
      projectRoot: values['project-root'],
      logLevel: values['log-level'],
    };

    // Log startup (stderr for stdio mode)
    if (config.transport === 'stdio') {
      log(colors.dim, `[agentful-mcp] Starting MCP server v${VERSION}`);
      log(colors.dim, `[agentful-mcp] Transport: ${config.transport}`);
      log(colors.dim, `[agentful-mcp] Project: ${config.projectRoot}`);
    } else {
      log(colors.green, `Starting Agentful MCP Server v${VERSION}`);
      log(colors.dim, `Transport: ${config.transport}`);
      log(colors.dim, `Host: ${config.host}:${config.port}`);
      log(colors.dim, `Project: ${config.projectRoot}`);
    }

    // Import transport factory
    const { createTransport, TransportType } = await import('../core/transport-factory.js');

    // Create transport based on configuration
    const transportConfig = {
      type: config.transport,
      options: {
        port: config.port,
        host: config.host,
        logLevel: config.logLevel
      }
    };

    const transport = createTransport(transportConfig);

    // Import and start actual MCP server
    const { createMCPServer } = await import('../server.js');
    const server = await createMCPServer({
      projectRoot: config.projectRoot,
      transport
    });

    await server.start();

    // Server is now running (stdio mode keeps process alive)
    if (config.transport !== 'stdio') {
      const protocol = transport.https ? 'https' : 'http';
      log(colors.green, `MCP server running on ${protocol}://${config.host}:${config.port}`);
      log(colors.dim, `Endpoints:`);

      if (config.transport === 'http') {
        log(colors.dim, `  - POST ${protocol}://${config.host}:${config.port}/mcp`);
        log(colors.dim, `  - GET  ${protocol}://${config.host}:${config.port}/health`);
      } else if (config.transport === 'sse') {
        log(colors.dim, `  - GET  ${protocol}://${config.host}:${config.port}/mcp/sse`);
        log(colors.dim, `  - POST ${protocol}://${config.host}:${config.port}/mcp/rpc`);
        log(colors.dim, `  - GET  ${protocol}://${config.host}:${config.port}/health`);
      }
    }

  } catch (error) {
    log(colors.red, `Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nShutting down gracefully...');
  process.exit(0);
});

main();
