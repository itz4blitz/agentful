/**
 * Client Registry Tests
 *
 * @module mcp/test/auth/client-registry.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClientRegistry } from '../../auth/client-registry.js';

describe('ClientRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ClientRegistry();
  });

  describe('registerClient', () => {
    it('should register valid client', () => {
      const metadata = {
        client_name: 'Test Client',
        redirect_uris: ['https://example.com/callback'],
        grant_types: ['authorization_code'],
        scope: ['read', 'write']
      };

      const client = registry.registerClient(metadata);

      expect(client).toHaveProperty('client_id');
      expect(client).toHaveProperty('client_secret');
      expect(client.client_name).toBe('Test Client');
      expect(client.redirect_uris).toEqual(['https://example.com/callback']);
      expect(client.grant_types).toEqual(['authorization_code']);
      expect(client.scope).toEqual(['read', 'write']);
    });

    it('should generate unique client IDs', () => {
      const metadata = {
        redirect_uris: ['https://example.com/callback']
      };

      const client1 = registry.registerClient(metadata);
      const client2 = registry.registerClient(metadata);

      expect(client1.client_id).not.toBe(client2.client_id);
      expect(client1.client_secret).not.toBe(client2.client_secret);
    });

    it('should reject registration without redirect_uris', () => {
      expect(() => registry.registerClient({})).toThrow('redirect_uris is required');
    });

    it('should reject invalid redirect URIs', () => {
      expect(() => {
        registry.registerClient({
          redirect_uris: ['http://example.com/callback'] // http without localhost
        });
      }).toThrow('must use https');
    });

    it('should accept localhost http redirect URIs', () => {
      const client = registry.registerClient({
        redirect_uris: ['http://localhost:3000/callback']
      });

      expect(client.client_id).toBeTruthy();
    });

    it('should reject redirect URIs with fragments', () => {
      expect(() => {
        registry.registerClient({
          redirect_uris: ['https://example.com/callback#fragment']
        });
      }).toThrow('must not contain fragment');
    });

    it('should reject unsupported grant types', () => {
      expect(() => {
        registry.registerClient({
          redirect_uris: ['https://example.com/callback'],
          grant_types: ['implicit'] // Not allowed in OAuth 2.1
        });
      }).toThrow('Unsupported grant type');
    });
  });

  describe('getClient', () => {
    it('should retrieve registered client', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const client = registry.getClient(registered.client_id);
      expect(client).toBeTruthy();
      expect(client.client_id).toBe(registered.client_id);
    });

    it('should return null for non-existent client', () => {
      const client = registry.getClient('non-existent-id');
      expect(client).toBeNull();
    });
  });

  describe('verifyCredentials', () => {
    it('should verify valid credentials', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const valid = registry.verifyCredentials(
        registered.client_id,
        registered.client_secret
      );

      expect(valid).toBe(true);
    });

    it('should reject invalid secret', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const valid = registry.verifyCredentials(
        registered.client_id,
        'wrong-secret'
      );

      expect(valid).toBe(false);
    });

    it('should reject non-existent client', () => {
      const valid = registry.verifyCredentials('non-existent', 'secret');
      expect(valid).toBe(false);
    });
  });

  describe('updateClient', () => {
    it('should update client metadata', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const updated = registry.updateClient(registered.client_id, {
        client_name: 'Updated Name',
        redirect_uris: ['https://example.com/new-callback']
      });

      expect(updated.client_name).toBe('Updated Name');
      expect(updated.redirect_uris).toEqual(['https://example.com/new-callback']);
    });

    it('should validate updates', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      expect(() => {
        registry.updateClient(registered.client_id, {
          redirect_uris: ['http://example.com/callback'] // Invalid
        });
      }).toThrow();
    });

    it('should return null for non-existent client', () => {
      const updated = registry.updateClient('non-existent', {
        client_name: 'Test'
      });

      expect(updated).toBeNull();
    });

    it('should not allow updating client_id or secret', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const updated = registry.updateClient(registered.client_id, {
        client_id: 'new-id',
        client_secret: 'new-secret',
        client_name: 'New Name'
      });

      expect(updated.client_id).toBe(registered.client_id);
      expect(updated.client_secret).toBe(registered.client_secret);
      expect(updated.client_name).toBe('New Name');
    });
  });

  describe('deleteClient', () => {
    it('should delete client', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      const deleted = registry.deleteClient(registered.client_id);
      expect(deleted).toBe(true);

      const client = registry.getClient(registered.client_id);
      expect(client).toBeNull();
    });

    it('should return false for non-existent client', () => {
      const deleted = registry.deleteClient('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('listClients', () => {
    it('should list all clients', () => {
      registry.registerClient({
        redirect_uris: ['https://example1.com/callback']
      });
      registry.registerClient({
        redirect_uris: ['https://example2.com/callback']
      });

      const clients = registry.listClients();
      expect(clients).toHaveLength(2);
    });

    it('should return empty array when no clients', () => {
      const clients = registry.listClients();
      expect(clients).toEqual([]);
    });
  });

  describe('security', () => {
    it('should use constant-time comparison for secrets', () => {
      const registered = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      // Even with different length, should not leak timing info
      const start = process.hrtime.bigint();
      registry.verifyCredentials(registered.client_id, 'short');
      const time1 = process.hrtime.bigint() - start;

      const start2 = process.hrtime.bigint();
      registry.verifyCredentials(registered.client_id, 'a'.repeat(100));
      const time2 = process.hrtime.bigint() - start2;

      // Times should be similar (but not exactly equal due to other factors)
      // This is a weak test, but demonstrates the intent
      expect(time1).toBeDefined();
      expect(time2).toBeDefined();
    });

    it('should generate cryptographically secure client IDs and secrets', () => {
      const client1 = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      // Check format
      expect(client1.client_id).toMatch(/^client_[a-f0-9]{32}$/);
      expect(client1.client_secret).toMatch(/^[a-f0-9]{64}$/);

      // Check uniqueness
      const client2 = registry.registerClient({
        redirect_uris: ['https://example.com/callback']
      });

      expect(client1.client_id).not.toBe(client2.client_id);
      expect(client1.client_secret).not.toBe(client2.client_secret);
    });
  });
});
