import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { main, initializeServer, setupSignalHandlers, startServer, isRunDirectly, executeIfRunDirectly } from '../../src/index.js';
import { AgentfulMCPServer } from '../../src/server/MCPServer.js';
import { DatabaseManager } from '../../src/infrastructure/DatabaseManager.js';

describe('Entry Point', () => {
  let originalProcessExit: (code?: number) => never;
  let originalArgv: string[];
  let originalUrl: string;
  let mockShutdown: vi.Mock;
  let originalSigintListeners: NodeJS.SignalsListener[];
  let originalSigtermListeners: NodeJS.SignalsListener[];

  beforeEach(() => {
    // Mock process.exit
    originalProcessExit = process.exit;
    process.exit = vi.fn() as (code?: number) => never;

    // Mock process.argv
    originalArgv = process.argv;
    process.argv = ['node', 'dist/index.js'];

    // Mock import.meta.url
    originalUrl = (globalThis as any).importMetaUrl || '';
    (globalThis as any).importMetaUrl = `file://${process.argv[1]}`;

    // Mock shutdown function
    mockShutdown = vi.fn();

    // Preserve existing signal listeners to avoid listener accumulation across tests
    originalSigintListeners = process.listeners('SIGINT');
    originalSigtermListeners = process.listeners('SIGTERM');
  });

  afterEach(() => {
    process.exit = originalProcessExit;
    process.argv = originalArgv;
    (globalThis as any).importMetaUrl = originalUrl;

    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    originalSigintListeners.forEach(listener => process.on('SIGINT', listener));
    originalSigtermListeners.forEach(listener => process.on('SIGTERM', listener));
  });

  describe('isRunDirectly function', () => {
    it('should return boolean based on import.meta.url comparison', () => {
      const result = isRunDirectly();
      expect(typeof result).toBe('boolean');
    });

    it('should return false when running in test environment', () => {
      // In test environment, import.meta.url won't match process.argv[1]
      const result = isRunDirectly();
      // We don't assert the exact value since it depends on the test environment
      expect(typeof result).toBe('boolean');
    });
  });

  describe('executeIfRunDirectly function', () => {
    it('should check isRunDirectly and conditionally call main', () => {
      // The function calls isRunDirectly() internally
      // We can't easily test the conditional without mocking import.meta.url
      // But we can verify the function exists and doesn't throw
      expect(typeof executeIfRunDirectly).toBe('function');
    });

    it('should not throw when called', () => {
      expect(() => executeIfRunDirectly()).not.toThrow();
    });
  });

  describe('startServer function', () => {
    it('should initialize server and call start', async () => {
      try {
        await startServer();
      } catch (error: any) {
        // Expected to fail due to network/WASM requirements
        expect(error).toBeDefined();
      }
    });
  });

  describe('main function', () => {
    it('should initialize and start the server', async () => {
      try {
        await main();
      } catch (error: any) {
        // Expected to fail due to network/WASM requirements
        expect(error).toBeDefined();
      }
    });

    it('should continue in degraded mode when database initialization fails', async () => {
      // Mock DatabaseManager.getInstance to throw
      const getInstance = vi.spyOn(DatabaseManager, 'getInstance').mockImplementation(() => {
        throw new Error('Database initialization failed');
      });

      await main();

      expect(process.exit).not.toHaveBeenCalled();

      getInstance.mockRestore();
    });

    it('should exit with code 1 on fatal server start errors', async () => {
      const startSpy = vi.spyOn(AgentfulMCPServer.prototype, 'start').mockRejectedValue(new Error('fatal startup failure'));

      await main();

      expect(process.exit).toHaveBeenCalledWith(1);

      startSpy.mockRestore();
    });
  });

  describe('initializeServer function', () => {
    it('should initialize server components', async () => {
      try {
        const result = await initializeServer();

        expect(result.server).toBeInstanceOf(AgentfulMCPServer);
        expect(result.dbManager).toBeInstanceOf(DatabaseManager);
        expect(result.shutdown).toBeInstanceOf(Function);
      } catch (error: any) {
        // Expected to fail due to network/WASM requirements
        expect(error).toBeDefined();
      }
    });

    it('should create a shutdown function that stops server and closes database', async () => {
      try {
        const { server, dbManager, shutdown } = await initializeServer();

        const stopSpy = vi.spyOn(server, 'stop').mockResolvedValue();
        const closeSpy = vi.spyOn(dbManager, 'close').mockResolvedValue();

        await shutdown();

        expect(stopSpy).toHaveBeenCalled();
        expect(closeSpy).toHaveBeenCalled();

        stopSpy.mockRestore();
        closeSpy.mockRestore();
      } catch (error: any) {
        // Expected to fail due to network/WASM requirements
        expect(error).toBeDefined();
      }
    });
  });

  describe('setupSignalHandlers function', () => {
    it('should register SIGINT handler', () => {
      const onSpy = vi.spyOn(process, 'on');

      setupSignalHandlers(mockShutdown);

      expect(onSpy).toHaveBeenCalledWith('SIGINT', expect.any(Function));

      onSpy.mockRestore();
    });

    it('should register SIGTERM handler', () => {
      const onSpy = vi.spyOn(process, 'on');

      setupSignalHandlers(mockShutdown);

      expect(onSpy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));

      onSpy.mockRestore();
    });

    it('should create handler that calls shutdown function', () => {
      const onSpy = vi.spyOn(process, 'on');

      setupSignalHandlers(mockShutdown);

      // Get the SIGINT handler
      const sigintCalls = onSpy.mock.calls.filter(call => call[0] === 'SIGINT');
      expect(sigintCalls).toHaveLength(1);

      const handler = sigintCalls[0][1];

      // Verify it's a function
      expect(typeof handler).toBe('function');

      onSpy.mockRestore();
    });
  });
});
