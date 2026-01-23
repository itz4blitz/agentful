import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  computeFileHash,
  getMetadata,
  saveMetadata,
  isFileCustomized,
  recordFileMetadata,
  initializeMetadata,
  getTrackedFiles,
  untrackFile,
  updateFileTracking,
  hasMetadata
} from '../../lib/update-helpers.js';

describe('update-helpers', () => {
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentful-test-'));
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('computeFileHash', () => {
    it('should compute SHA256 hash of a file', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'hello world');

      const hash = await computeFileHash(testFile);

      expect(hash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(hash).toBe('sha256:b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        computeFileHash(path.join(testDir, 'nonexistent.txt'))
      ).rejects.toThrow();
    });
  });

  describe('metadata operations', () => {
    it('should initialize metadata', async () => {
      const metadata = await initializeMetadata(testDir, '1.0.0');

      expect(metadata).toMatchObject({
        installed_version: '1.0.0',
        files: {}
      });
      expect(metadata.installed_at).toBeDefined();

      // Verify file was created
      const saved = await getMetadata(testDir);
      expect(saved).toMatchObject(metadata);
    });

    it('should return null for non-existent metadata', async () => {
      const metadata = await getMetadata(testDir);
      expect(metadata).toBeNull();
    });

    it('should save and retrieve metadata', async () => {
      const testMetadata = {
        installed_version: '1.0.0',
        installed_at: '2026-01-21T00:00:00Z',
        files: {
          'test.txt': {
            hash: 'sha256:abc123',
            source: 'npm',
            installed_at: '2026-01-21T00:00:00Z'
          }
        }
      };

      await saveMetadata(testDir, testMetadata);
      const retrieved = await getMetadata(testDir);

      expect(retrieved).toEqual(testMetadata);
    });

    it('should check if metadata exists', async () => {
      expect(await hasMetadata(testDir)).toBe(false);

      await initializeMetadata(testDir, '1.0.0');

      expect(await hasMetadata(testDir)).toBe(true);
    });
  });

  describe('recordFileMetadata', () => {
    it('should record file metadata', async () => {
      await initializeMetadata(testDir, '1.0.0');

      await recordFileMetadata(
        testDir,
        'test.txt',
        'sha256:abc123',
        '1.0.0'
      );

      const metadata = await getMetadata(testDir);
      expect(metadata.files['test.txt']).toMatchObject({
        hash: 'sha256:abc123',
        source: 'npm'
      });
      expect(metadata.files['test.txt'].installed_at).toBeDefined();
    });

    it('should initialize metadata if not exists', async () => {
      await recordFileMetadata(
        testDir,
        'test.txt',
        'sha256:abc123',
        '1.0.0'
      );

      const metadata = await getMetadata(testDir);
      expect(metadata).toBeDefined();
      expect(metadata.installed_version).toBe('1.0.0');
    });
  });

  describe('isFileCustomized', () => {
    it('should return customized=true when no metadata exists', async () => {
      const result = await isFileCustomized(testDir, 'test.txt');

      expect(result).toEqual({
        customized: true,
        reason: 'no_metadata'
      });
    });

    it('should return customized=true for user-added files', async () => {
      await initializeMetadata(testDir, '1.0.0');

      const result = await isFileCustomized(testDir, 'user-file.txt');

      expect(result).toEqual({
        customized: true,
        reason: 'user_added'
      });
    });

    it('should return customized=true for deleted files', async () => {
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(
        testDir,
        'deleted.txt',
        'sha256:abc123',
        '1.0.0'
      );

      const result = await isFileCustomized(testDir, 'deleted.txt');

      expect(result).toEqual({
        customized: true,
        reason: 'user_deleted'
      });
    });

    it('should return customized=false for unchanged files', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'hello world');

      const hash = await computeFileHash(testFile);
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(testDir, 'test.txt', hash, '1.0.0');

      const result = await isFileCustomized(testDir, 'test.txt');

      expect(result).toEqual({
        customized: false,
        reason: 'unchanged'
      });
    });

    it('should return customized=true for modified files', async () => {
      const testFile = path.join(testDir, 'test.txt');
      await fs.writeFile(testFile, 'hello world');

      const hash = await computeFileHash(testFile);
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(testDir, 'test.txt', hash, '1.0.0');

      // Modify file
      await fs.writeFile(testFile, 'hello world modified');

      const result = await isFileCustomized(testDir, 'test.txt');

      expect(result).toEqual({
        customized: true,
        reason: 'modified'
      });
    });
  });

  describe('getTrackedFiles', () => {
    it('should return empty array when no metadata', async () => {
      const files = await getTrackedFiles(testDir);
      expect(files).toEqual([]);
    });

    it('should return list of tracked files', async () => {
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(testDir, 'file1.txt', 'sha256:abc', '1.0.0');
      await recordFileMetadata(testDir, 'file2.txt', 'sha256:def', '1.0.0');

      const files = await getTrackedFiles(testDir);

      expect(files).toContain('file1.txt');
      expect(files).toContain('file2.txt');
      expect(files).toHaveLength(2);
    });
  });

  describe('untrackFile', () => {
    it('should remove file from tracking', async () => {
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(testDir, 'file.txt', 'sha256:abc', '1.0.0');

      await untrackFile(testDir, 'file.txt');

      const metadata = await getMetadata(testDir);
      expect(metadata.files['file.txt']).toBeUndefined();
    });

    it('should handle non-existent metadata gracefully', async () => {
      await expect(
        untrackFile(testDir, 'file.txt')
      ).resolves.not.toThrow();
    });
  });

  describe('updateFileTracking', () => {
    it('should update file hash and version', async () => {
      await initializeMetadata(testDir, '1.0.0');
      await recordFileMetadata(testDir, 'file.txt', 'sha256:old', '1.0.0');

      await updateFileTracking(testDir, 'file.txt', 'sha256:new', '1.1.0');

      const metadata = await getMetadata(testDir);
      expect(metadata.files['file.txt'].hash).toBe('sha256:new');
      expect(metadata.files['file.txt'].updated_to_version).toBe('1.1.0');
      expect(metadata.files['file.txt'].updated_at).toBeDefined();
      expect(metadata.installed_version).toBe('1.1.0');
      expect(metadata.last_updated).toBeDefined();
    });

    it('should add new files during update', async () => {
      await initializeMetadata(testDir, '1.0.0');

      await updateFileTracking(testDir, 'new-file.txt', 'sha256:new', '1.1.0');

      const metadata = await getMetadata(testDir);
      expect(metadata.files['new-file.txt']).toBeDefined();
      expect(metadata.files['new-file.txt'].hash).toBe('sha256:new');
    });

    it('should throw error if metadata does not exist', async () => {
      await expect(
        updateFileTracking(testDir, 'file.txt', 'sha256:new', '1.1.0')
      ).rejects.toThrow('Cannot update tracking: no metadata exists');
    });
  });
});
