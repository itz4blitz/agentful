const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Atomically writes content to a file using a temporary file and rename operation.
 * This prevents partial writes and corruption if the process is interrupted.
 *
 * @param {string} filePath - The target file path to write to
 * @param {string|Buffer} content - The content to write to the file
 * @param {object} options - Optional write options
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {number} options.mode - File mode (permissions)
 * @returns {Promise<void>}
 * @throws {Error} If parent directory doesn't exist or write fails
 *
 * @example
 * await atomicWrite('/path/to/file.json', JSON.stringify(data));
 */
async function atomicWrite(filePath, content, options = {}) {
  const { encoding = 'utf8', mode } = options;

  // Normalize the path
  const targetPath = path.resolve(filePath);
  const targetDir = path.dirname(targetPath);

  // Ensure parent directory exists
  try {
    await fs.access(targetDir);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Parent directory does not exist: ${targetDir}`);
    }
    throw new Error(`Cannot access parent directory: ${error.message}`);
  }

  // Generate unique temporary file name in the same directory as target
  // Using same directory ensures rename is atomic (same filesystem)
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const tempPath = `${targetPath}.tmp.${timestamp}.${random}`;

  let tempFileCreated = false;

  try {
    // Write to temporary file
    const writeOptions = { encoding };
    if (mode !== undefined) {
      writeOptions.mode = mode;
    }

    await fs.writeFile(tempPath, content, writeOptions);
    tempFileCreated = true;

    // Atomically move temporary file to target location
    // On POSIX systems, rename() is atomic
    // On Windows, this may fail if target exists, so we handle that
    try {
      await fs.rename(tempPath, targetPath);
    } catch (renameError) {
      if (renameError.code === 'EPERM' || renameError.code === 'EACCES') {
        // Permission error - clean up and throw
        throw new Error(`Insufficient permissions to write to: ${targetPath}`);
      }

      // On Windows, rename may fail if file exists
      // Try to unlink target and retry once
      if (process.platform === 'win32' && renameError.code === 'EEXIST') {
        try {
          await fs.unlink(targetPath);
          await fs.rename(tempPath, targetPath);
        } catch (retryError) {
          throw new Error(`Failed to atomically replace file: ${retryError.message}`);
        }
      } else {
        throw renameError;
      }
    }

    tempFileCreated = false; // Successfully moved, no cleanup needed
  } catch (error) {
    // Clean up temporary file if it was created
    if (tempFileCreated) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Log but don't throw - original error is more important
        console.warn(`Warning: Failed to clean up temporary file ${tempPath}: ${cleanupError.message}`);
      }
    }

    // Re-throw the original error with context
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Insufficient permissions to write to: ${targetPath}`);
    }
    throw error;
  }
}

/**
 * Atomically updates a file by reading it, applying a transformation function,
 * and writing the result back atomically. This ensures read-modify-write consistency.
 *
 * @param {string} filePath - The file path to update
 * @param {function(string): string|Promise<string>} updateFn - Function that receives current content and returns new content
 * @param {object} options - Optional read/write options
 * @param {string} options.encoding - File encoding (default: 'utf8')
 * @param {boolean} options.createIfMissing - Create file with empty content if it doesn't exist (default: false)
 * @returns {Promise<void>}
 * @throws {Error} If file doesn't exist (unless createIfMissing is true) or update fails
 *
 * @example
 * // Update JSON file
 * await atomicUpdate('/path/to/config.json', (content) => {
 *   const data = JSON.parse(content);
 *   data.lastUpdated = Date.now();
 *   return JSON.stringify(data, null, 2);
 * });
 *
 * @example
 * // Append to file
 * await atomicUpdate('/path/to/log.txt', (content) => {
 *   return content + '\nNew log entry';
 * });
 */
async function atomicUpdate(filePath, updateFn, options = {}) {
  const { encoding = 'utf8', createIfMissing = false } = options;

  if (typeof updateFn !== 'function') {
    throw new Error('updateFn must be a function');
  }

  const targetPath = path.resolve(filePath);
  let currentContent = '';

  // Read current content
  try {
    currentContent = await fs.readFile(targetPath, { encoding });
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (createIfMissing) {
        // File doesn't exist, start with empty content
        currentContent = '';
      } else {
        throw new Error(`File does not exist: ${targetPath}`);
      }
    } else if (error.code === 'EACCES' || error.code === 'EPERM') {
      throw new Error(`Insufficient permissions to read: ${targetPath}`);
    } else {
      throw error;
    }
  }

  // Apply transformation
  let newContent;
  try {
    newContent = await Promise.resolve(updateFn(currentContent));
  } catch (error) {
    throw new Error(`Update function failed: ${error.message}`);
  }

  // Validate that updateFn returned a value
  if (newContent === undefined || newContent === null) {
    throw new Error('Update function must return a value (received undefined or null)');
  }

  // Write atomically
  await atomicWrite(targetPath, newContent, { encoding });
}

/**
 * Performs multiple atomic write operations in an all-or-nothing fashion.
 * If any write fails, all successful writes are rolled back to their original state.
 *
 * @param {Array<{path: string, content: string|Buffer, encoding?: string}>} operations - Array of write operations
 * @returns {Promise<void>}
 * @throws {Error} If any operation fails (after rollback)
 *
 * @example
 * await multiWrite([
 *   { path: '/path/to/file1.json', content: JSON.stringify(data1) },
 *   { path: '/path/to/file2.json', content: JSON.stringify(data2) },
 *   { path: '/path/to/file3.txt', content: 'text data' }
 * ]);
 */
async function multiWrite(operations) {
  if (!Array.isArray(operations)) {
    throw new Error('operations must be an array');
  }

  if (operations.length === 0) {
    return; // Nothing to do
  }

  // Validate all operations first
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (!op || typeof op !== 'object') {
      throw new Error(`Operation at index ${i} must be an object`);
    }
    if (!op.path || typeof op.path !== 'string') {
      throw new Error(`Operation at index ${i} must have a 'path' string property`);
    }
    if (op.content === undefined || op.content === null) {
      throw new Error(`Operation at index ${i} must have a 'content' property`);
    }
  }

  // Create backup information for rollback
  const backups = [];
  const tempFiles = [];
  let successfulWrites = 0;

  try {
    // Phase 1: Read existing files and create backups
    for (const op of operations) {
      const targetPath = path.resolve(op.path);
      let existingContent = null;
      let fileExists = false;

      try {
        existingContent = await fs.readFile(targetPath);
        fileExists = true;
      } catch (error) {
        if (error.code !== 'ENOENT') {
          // File exists but can't be read - this is an error
          throw new Error(`Cannot read existing file ${targetPath}: ${error.message}`);
        }
        // File doesn't exist - that's fine, we'll create it
      }

      backups.push({
        path: targetPath,
        content: existingContent,
        existed: fileExists
      });
    }

    // Phase 2: Write all files to temporary locations
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i];
      const targetPath = path.resolve(op.path);
      const targetDir = path.dirname(targetPath);
      const encoding = op.encoding || 'utf8';

      // Ensure parent directory exists
      try {
        await fs.access(targetDir);
      } catch (error) {
        if (error.code === 'ENOENT') {
          throw new Error(`Parent directory does not exist: ${targetDir}`);
        }
        throw new Error(`Cannot access parent directory: ${error.message}`);
      }

      // Create temporary file
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const tempPath = `${targetPath}.tmp.${timestamp}.${random}`;

      await fs.writeFile(tempPath, op.content, { encoding });
      tempFiles.push({ tempPath, targetPath, encoding });
    }

    // Phase 3: Atomically move all temp files to targets
    for (const { tempPath, targetPath } of tempFiles) {
      try {
        await fs.rename(tempPath, targetPath);
      } catch (renameError) {
        // On Windows, handle file exists case
        if (process.platform === 'win32' && renameError.code === 'EEXIST') {
          try {
            await fs.unlink(targetPath);
            await fs.rename(tempPath, targetPath);
          } catch (retryError) {
            throw new Error(`Failed to atomically replace file ${targetPath}: ${retryError.message}`);
          }
        } else {
          throw renameError;
        }
      }
      successfulWrites++;
    }

    // Success - clear temp file tracking
    tempFiles.length = 0;

  } catch (error) {
    // Rollback: Restore all successfully written files to original state
    console.error(`Multi-write operation failed: ${error.message}`);
    console.error(`Rolling back ${successfulWrites} successful writes...`);

    const rollbackErrors = [];

    // Restore files that were successfully written
    for (let i = 0; i < successfulWrites; i++) {
      const backup = backups[i];
      try {
        if (backup.existed) {
          // Restore original content
          await fs.writeFile(backup.path, backup.content);
        } else {
          // File didn't exist before, remove it
          try {
            await fs.unlink(backup.path);
          } catch (unlinkError) {
            if (unlinkError.code !== 'ENOENT') {
              throw unlinkError;
            }
            // File already doesn't exist - that's fine
          }
        }
      } catch (rollbackError) {
        rollbackErrors.push({
          path: backup.path,
          error: rollbackError.message
        });
      }
    }

    // Clean up any remaining temp files
    for (const { tempPath } of tempFiles) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        if (cleanupError.code !== 'ENOENT') {
          console.warn(`Warning: Failed to clean up temp file ${tempPath}: ${cleanupError.message}`);
        }
      }
    }

    // Report rollback status
    if (rollbackErrors.length > 0) {
      const rollbackDetails = rollbackErrors.map(e => `  - ${e.path}: ${e.error}`).join('\n');
      throw new Error(
        `Multi-write operation failed and rollback encountered errors:\n` +
        `Original error: ${error.message}\n` +
        `Rollback errors:\n${rollbackDetails}`
      );
    }

    throw new Error(`Multi-write operation failed and was rolled back: ${error.message}`);
  }
}

module.exports = {
  atomicWrite,
  atomicUpdate,
  multiWrite
};
