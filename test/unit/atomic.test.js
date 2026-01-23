import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { atomicWrite, atomicUpdate, multiWrite } from '../../lib/atomic.js';
import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Atomic File Operations Unit Tests
 *
 * Tests for atomic file write operations
 * Covers atomic write, update, and multi-write operations
 */

describe('atomicWrite', () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'atomic-test-'));
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should write file successfully', async () => {
    const filePath = path.join(testDir, 'test.txt');
    const content = 'Hello, World!';

    await atomicWrite(filePath, content);

    const written = await fs.readFile(filePath, 'utf-8');
    expect(written).toBe(content);
  });

  it('should overwrite existing file', async () => {
    const filePath = path.join(testDir, 'test.txt');

    await atomicWrite(filePath, 'first');
    await atomicWrite(filePath, 'second');

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('second');
  });

  it('should handle JSON content', async () => {
    const filePath = path.join(testDir, 'data.json');
    const data = { key: 'value', nested: { prop: 'data' } };
    const content = JSON.stringify(data, null, 2);

    await atomicWrite(filePath, content);

    const written = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(written);
    expect(parsed).toEqual(data);
  });

  it('should handle Buffer content', async () => {
    const filePath = path.join(testDir, 'binary.dat');
    const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

    await atomicWrite(filePath, buffer);

    const written = await fs.readFile(filePath);
    expect(written).toEqual(buffer);
  });

  it('should respect encoding option', async () => {
    const filePath = path.join(testDir, 'utf16.txt');
    const content = 'UTF-16 content';

    await atomicWrite(filePath, content, { encoding: 'utf16le' });

    const written = await fs.readFile(filePath, 'utf16le');
    expect(written).toBe(content);
  });

  it('should throw error for non-existent parent directory', async () => {
    const filePath = path.join(testDir, 'nonexistent', 'test.txt');

    await expect(atomicWrite(filePath, 'content')).rejects.toThrow('Parent directory does not exist');
  });

  it('should create nested directory if parent exists', async () => {
    const nestedDir = path.join(testDir, 'nested');
    await fs.mkdir(nestedDir);

    const filePath = path.join(nestedDir, 'test.txt');
    await atomicWrite(filePath, 'content');

    const written = await fs.readFile(filePath, 'utf-8');
    expect(written).toBe('content');
  });

  it('should handle concurrent writes to same file', async () => {
    const filePath = path.join(testDir, 'concurrent.txt');

    // Start multiple writes concurrently
    await Promise.all([
      atomicWrite(filePath, 'write1'),
      atomicWrite(filePath, 'write2'),
      atomicWrite(filePath, 'write3')
    ]);

    // File should contain one of the writes (not corrupted)
    const content = await fs.readFile(filePath, 'utf-8');
    expect(['write1', 'write2', 'write3']).toContain(content);
  });

  it('should handle write to root directory file', async () => {
    const filePath = path.join(testDir, 'root-file.txt');
    await atomicWrite(filePath, 'root content');

    const content = await fs.readFile(filePath, 'utf-8');
    expect(content).toBe('root content');
  });

  it('should preserve file permissions when specified', async () => {
    const filePath = path.join(testDir, 'perms.txt');

    await atomicWrite(filePath, 'content', { mode: 0o644 });

    const stats = await fs.stat(filePath);
    // Check that file is readable/writable by owner
    expect((stats.mode & 0o600) === 0o600).toBe(true);
  });
});

describe('atomicUpdate', () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'atomic-update-test-'));
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should read and update file', async () => {
    const filePath = path.join(testDir, 'test.txt');
    await fs.writeFile(filePath, 'initial');

    await atomicUpdate(filePath, (content) => {
      return content + ' updated';
    });

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('initial updated');
  });

  it('should update JSON file', async () => {
    const filePath = path.join(testDir, 'data.json');
    const initial = { count: 0, name: 'test' };
    await fs.writeFile(filePath, JSON.stringify(initial));

    await atomicUpdate(filePath, (content) => {
      const data = JSON.parse(content);
      data.count++;
      return JSON.stringify(data, null, 2);
    });

    const result = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(1);
    expect(parsed.name).toBe('test');
  });

  it('should support async update functions', async () => {
    const filePath = path.join(testDir, 'async.txt');
    await fs.writeFile(filePath, 'initial');

    await atomicUpdate(filePath, async (content) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      return content + ' async';
    });

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('initial async');
  });

  it('should throw error for non-existent file by default', async () => {
    const filePath = path.join(testDir, 'nonexistent.txt');

    await expect(
      atomicUpdate(filePath, content => content + 'updated')
    ).rejects.toThrow('File does not exist');
  });

  it('should create file when createIfMissing is true', async () => {
    const filePath = path.join(testDir, 'new.txt');

    await atomicUpdate(
      filePath,
      (content) => content + 'new content',
      { createIfMissing: true }
    );

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('new content');
  });

  it('should throw error if updateFn is not a function', async () => {
    const filePath = path.join(testDir, 'test.txt');
    await fs.writeFile(filePath, 'content');

    await expect(
      atomicUpdate(filePath, 'not a function')
    ).rejects.toThrow('updateFn must be a function');
  });

  it('should throw error if updateFn returns null/undefined', async () => {
    const filePath = path.join(testDir, 'test.txt');
    await fs.writeFile(filePath, 'content');

    await expect(
      atomicUpdate(filePath, () => null)
    ).rejects.toThrow('Update function must return a value');

    await expect(
      atomicUpdate(filePath, () => undefined)
    ).rejects.toThrow('Update function must return a value');
  });

  it('should throw error if updateFn throws', async () => {
    const filePath = path.join(testDir, 'test.txt');
    await fs.writeFile(filePath, 'content');

    await expect(
      atomicUpdate(filePath, () => {
        throw new Error('Update failed');
      })
    ).rejects.toThrow('Update function failed');
  });

  it('should handle empty file', async () => {
    const filePath = path.join(testDir, 'empty.txt');
    await fs.writeFile(filePath, '');

    await atomicUpdate(filePath, (content) => {
      expect(content).toBe('');
      return 'not empty anymore';
    });

    const result = await fs.readFile(filePath, 'utf-8');
    expect(result).toBe('not empty anymore');
  });

  it('should preserve encoding', async () => {
    const filePath = path.join(testDir, 'utf16.txt');
    await fs.writeFile(filePath, 'initial', 'utf16le');

    await atomicUpdate(
      filePath,
      (content) => content + ' updated',
      { encoding: 'utf16le' }
    );

    const result = await fs.readFile(filePath, 'utf16le');
    expect(result).toBe('initial updated');
  });
});

describe('multiWrite', () => {
  let testDir;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'multi-write-test-'));
  });

  afterEach(async () => {
    if (testDir) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('should write multiple files', async () => {
    const operations = [
      { path: path.join(testDir, 'file1.txt'), content: 'content1' },
      { path: path.join(testDir, 'file2.txt'), content: 'content2' },
      { path: path.join(testDir, 'file3.txt'), content: 'content3' }
    ];

    await multiWrite(operations);

    const content1 = await fs.readFile(path.join(testDir, 'file1.txt'), 'utf-8');
    const content2 = await fs.readFile(path.join(testDir, 'file2.txt'), 'utf-8');
    const content3 = await fs.readFile(path.join(testDir, 'file3.txt'), 'utf-8');

    expect(content1).toBe('content1');
    expect(content2).toBe('content2');
    expect(content3).toBe('content3');
  });

  it('should rollback on error', async () => {
    // Create first file
    const file1 = path.join(testDir, 'file1.txt');
    await fs.writeFile(file1, 'original1');

    const operations = [
      { path: file1, content: 'modified1' },
      { path: path.join(testDir, 'nonexistent', 'file2.txt'), content: 'content2' }
    ];

    await expect(multiWrite(operations)).rejects.toThrow();

    // First file should be restored
    const content1 = await fs.readFile(file1, 'utf-8');
    expect(content1).toBe('original1');
  });

  it('should create new files atomically', async () => {
    const operations = [
      { path: path.join(testDir, 'new1.txt'), content: 'new content 1' },
      { path: path.join(testDir, 'new2.txt'), content: 'new content 2' }
    ];

    await multiWrite(operations);

    const content1 = await fs.readFile(path.join(testDir, 'new1.txt'), 'utf-8');
    const content2 = await fs.readFile(path.join(testDir, 'new2.txt'), 'utf-8');

    expect(content1).toBe('new content 1');
    expect(content2).toBe('new content 2');
  });

  it('should handle empty operations array', async () => {
    await expect(multiWrite([])).resolves.not.toThrow();
  });

  it('should throw error for invalid operations', async () => {
    await expect(multiWrite('not an array')).rejects.toThrow('operations must be an array');
  });

  it('should validate operation structure', async () => {
    const operations = [
      { path: path.join(testDir, 'file1.txt') } // missing content
    ];

    await expect(multiWrite(operations)).rejects.toThrow('must have a \'content\' property');
  });

  it('should handle mix of new and existing files', async () => {
    const existing = path.join(testDir, 'existing.txt');
    await fs.writeFile(existing, 'old');

    const operations = [
      { path: existing, content: 'updated' },
      { path: path.join(testDir, 'new.txt'), content: 'new' }
    ];

    await multiWrite(operations);

    const existingContent = await fs.readFile(existing, 'utf-8');
    const newContent = await fs.readFile(path.join(testDir, 'new.txt'), 'utf-8');

    expect(existingContent).toBe('updated');
    expect(newContent).toBe('new');
  });

  it('should rollback all files if any fails', async () => {
    const file1 = path.join(testDir, 'file1.txt');
    const file2 = path.join(testDir, 'file2.txt');

    await fs.writeFile(file1, 'original1');
    await fs.writeFile(file2, 'original2');

    const operations = [
      { path: file1, content: 'modified1' },
      { path: file2, content: 'modified2' },
      { path: path.join(testDir, 'invalid', 'file3.txt'), content: 'will fail' }
    ];

    await expect(multiWrite(operations)).rejects.toThrow();

    // Both files should be restored
    const content1 = await fs.readFile(file1, 'utf-8');
    const content2 = await fs.readFile(file2, 'utf-8');

    expect(content1).toBe('original1');
    expect(content2).toBe('original2');
  });

  it('should handle JSON content', async () => {
    const operations = [
      { path: path.join(testDir, 'data1.json'), content: JSON.stringify({ a: 1 }) },
      { path: path.join(testDir, 'data2.json'), content: JSON.stringify({ b: 2 }) }
    ];

    await multiWrite(operations);

    const data1 = JSON.parse(await fs.readFile(path.join(testDir, 'data1.json'), 'utf-8'));
    const data2 = JSON.parse(await fs.readFile(path.join(testDir, 'data2.json'), 'utf-8'));

    expect(data1).toEqual({ a: 1 });
    expect(data2).toEqual({ b: 2 });
  });

  it('should respect encoding option', async () => {
    const operations = [
      { path: path.join(testDir, 'utf16.txt'), content: 'UTF-16 content', encoding: 'utf16le' }
    ];

    await multiWrite(operations);

    const content = await fs.readFile(path.join(testDir, 'utf16.txt'), 'utf16le');
    expect(content).toBe('UTF-16 content');
  });

  it('should remove created files on rollback', async () => {
    const newFile = path.join(testDir, 'new.txt');
    const operations = [
      { path: newFile, content: 'new content' },
      { path: path.join(testDir, 'invalid', 'fail.txt'), content: 'fail' }
    ];

    await expect(multiWrite(operations)).rejects.toThrow();

    // New file should not exist
    await expect(fs.access(newFile)).rejects.toThrow();
  });
});
