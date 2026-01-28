#!/usr/bin/env node

/**
 * MCP Server Entry Point
 * agentful Pattern Learning Server
 */

import { realpathSync } from 'fs';
import { DatabaseManager } from './infrastructure/DatabaseManager.js';
import { PatternRepository } from './infrastructure/PatternRepository.js';
import { ErrorRepository } from './infrastructure/ErrorRepository.js';
import { EmbeddingService } from './services/EmbeddingService.js';
import { AgentfulMCPServer } from './server/MCPServer.js';

/**
 * Check if this module is being run directly (exported for testing)
 * Handles symlinks by resolving the real path of process.argv[1]
 */
export function isRunDirectly(): boolean {
  try {
    const realPath = realpathSync(process.argv[1]);
    const realUrl = `file://${realPath}`;
    return import.meta.url === realUrl;
  } catch {
    // Fallback to original check if realpath fails
    return import.meta.url === `file://${process.argv[1]}`;
  }
}

/**
 * Initialize server components (exported for testing)
 */
export async function initializeServer(): Promise<{
  server: AgentfulMCPServer;
  dbManager: DatabaseManager | null;
  shutdown: () => Promise<void>;
}> {
  try {
    // Initialize database
    const dbManager = DatabaseManager.getInstance();
    await dbManager.migrate();

    // Initialize repositories
    const db = await dbManager.getConnection();
    const patternRepo = new PatternRepository(db);
    const errorRepo = new ErrorRepository(db);

    // Initialize embedding service
    const embeddingService = EmbeddingService.getInstance();

    // Initialize MCP server
    const server = new AgentfulMCPServer(patternRepo, errorRepo, embeddingService);

    // Create shutdown function
    const shutdown = async (): Promise<void> => {
      console.error('\n[MCP Server] Shutting down...');
      await server.stop();
      dbManager.close();
    };

    return { server, dbManager, shutdown };
  } catch (error) {
    // Graceful degradation: start server without database
    console.error('[MCP Server] Warning: Database initialization failed, starting in degraded mode:', error instanceof Error ? error.message : error);

    // Create null repositories that will return appropriate errors
    const nullPatternRepo = null;
    const nullErrorRepo = null;
    const nullEmbeddingService = null;

    // Initialize MCP server with null dependencies
    const server = new AgentfulMCPServer(nullPatternRepo, nullErrorRepo, nullEmbeddingService);

    // Create shutdown function (no database to close)
    const shutdown = async (): Promise<void> => {
      console.error('\n[MCP Server] Shutting down...');
      await server.stop();
    };

    return { server, dbManager: null, shutdown };
  }
}

/**
 * Setup signal handlers (exported for testing)
 */
export function setupSignalHandlers(shutdown: () => Promise<void>): void {
  process.on('SIGINT', async () => {
    await shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await shutdown();
    process.exit(0);
  });
}

/**
 * Start the server (extracted for testing)
 */
export async function startServer(): Promise<void> {
  const { server, shutdown } = await initializeServer();
  await server.start();
  setupSignalHandlers(shutdown);
}

/**
 * Main entry point
 */
export async function main(): Promise<void> {
  try {
    await startServer();
  } catch (error) {
    console.error('[MCP Server] Fatal error:', error);
    process.exit(1);
  }
}

/**
 * Execute main if run directly (exported for testing)
 */
export function executeIfRunDirectly(): void {
  if (isRunDirectly()) {
    main();
  }
}

// Start server if this file is run directly
executeIfRunDirectly();
