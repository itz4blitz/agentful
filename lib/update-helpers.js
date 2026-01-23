import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const METADATA_FILE = '.agentful/update-metadata.json';
const BACKUP_DIR = '.agentful/backups';

/**
 * Compute SHA256 hash of a file
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<string>} Hash in format "sha256:..."
 */
export async function computeFileHash(filePath) {
  try {
    const content = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `sha256:${hash}`;
  } catch (error) {
    throw new Error(`Failed to compute hash for ${filePath}: ${error.message}`);
  }
}

/**
 * Get update metadata from .agentful/update-metadata.json
 * @param {string} targetDir - Project directory
 * @returns {Promise<Object|null>} Metadata object or null if doesn't exist
 */
export async function getMetadata(targetDir) {
  const metadataPath = path.join(targetDir, METADATA_FILE);

  try {
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist - old installation or first time
      return null;
    }
    throw new Error(`Failed to read metadata: ${error.message}`);
  }
}

/**
 * Save update metadata to .agentful/update-metadata.json
 * @param {string} targetDir - Project directory
 * @param {Object} metadata - Metadata object to save
 * @returns {Promise<void>}
 */
export async function saveMetadata(targetDir, metadata) {
  const metadataPath = path.join(targetDir, METADATA_FILE);

  try {
    // Ensure .agentful directory exists
    await fs.mkdir(path.dirname(metadataPath), { recursive: true });

    // Write metadata with pretty formatting
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(`Failed to save metadata: ${error.message}`);
  }
}

/**
 * Check if a file has been customized by comparing current hash vs metadata
 * @param {string} targetDir - Project directory
 * @param {string} relativePath - Relative path from project root (e.g., ".claude/agents/backend.md")
 * @returns {Promise<{customized: boolean, reason: string}>}
 */
export async function isFileCustomized(targetDir, relativePath) {
  // Get metadata
  const metadata = await getMetadata(targetDir);

  // If no metadata exists, assume all files are customized (safe default)
  if (!metadata) {
    return {
      customized: true,
      reason: 'no_metadata'
    };
  }

  // If file not in metadata, it was added by user
  if (!metadata.files[relativePath]) {
    return {
      customized: true,
      reason: 'user_added'
    };
  }

  // Check if file exists
  const filePath = path.join(targetDir, relativePath);
  try {
    await fs.access(filePath);
  } catch {
    // File was deleted by user
    return {
      customized: true,
      reason: 'user_deleted'
    };
  }

  // Compute current hash
  try {
    const currentHash = await computeFileHash(filePath);
    const originalHash = metadata.files[relativePath].hash;

    if (currentHash !== originalHash) {
      return {
        customized: true,
        reason: 'modified'
      };
    }

    // File unchanged
    return {
      customized: false,
      reason: 'unchanged'
    };
  } catch (error) {
    // If we can't compute hash, err on safe side
    return {
      customized: true,
      reason: 'hash_error'
    };
  }
}

/**
 * Get canonical file content from npm package template
 * @param {string} relativePath - Relative path (e.g., ".claude/agents/backend.md" or "CLAUDE.md")
 * @param {string} packageRoot - Root directory of npm package (usually __dirname/../)
 * @returns {Promise<Buffer|null>} File content or null if not found
 */
export async function getCanonicalFile(relativePath, packageRoot) {
  // Determine source location based on path
  let sourcePath;

  if (relativePath.startsWith('.claude/')) {
    // Files from .claude/ directory
    sourcePath = path.join(packageRoot, relativePath);
  } else if (relativePath.startsWith('bin/hooks/')) {
    // Hook files
    sourcePath = path.join(packageRoot, relativePath);
  } else if (relativePath === 'CLAUDE.md') {
    // Template file
    sourcePath = path.join(packageRoot, 'template', relativePath);
  } else {
    throw new Error(`Unknown file source for ${relativePath}`);
  }

  try {
    return await fs.readFile(sourcePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw new Error(`Failed to read canonical file ${relativePath}: ${error.message}`);
  }
}

/**
 * Backup a file before updating
 * @param {string} filePath - Absolute path to file to backup
 * @param {string} targetDir - Project directory
 * @returns {Promise<string>} Path to backup file
 */
export async function backupFile(filePath, targetDir) {
  const backupDir = path.join(targetDir, BACKUP_DIR);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const relativePath = path.relative(targetDir, filePath);
  const backupPath = path.join(
    backupDir,
    timestamp,
    relativePath
  );

  try {
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });

    // Copy file to backup location
    await fs.copyFile(filePath, backupPath);

    return backupPath;
  } catch (error) {
    throw new Error(`Failed to backup ${filePath}: ${error.message}`);
  }
}

/**
 * Record file metadata after installation
 * @param {string} targetDir - Project directory
 * @param {string} relativePath - Relative path from project root
 * @param {string} hash - File hash
 * @param {string} version - Package version
 * @returns {Promise<void>}
 */
export async function recordFileMetadata(targetDir, relativePath, hash, version) {
  let metadata = await getMetadata(targetDir);

  // Initialize metadata if doesn't exist
  if (!metadata) {
    metadata = {
      installed_version: version,
      installed_at: new Date().toISOString(),
      files: {}
    };
  }

  // Record file metadata
  metadata.files[relativePath] = {
    hash,
    source: 'npm',
    installed_at: new Date().toISOString()
  };

  // Save updated metadata
  await saveMetadata(targetDir, metadata);
}

/**
 * Get list of all tracked files
 * @param {string} targetDir - Project directory
 * @returns {Promise<string[]>} Array of relative paths
 */
export async function getTrackedFiles(targetDir) {
  const metadata = await getMetadata(targetDir);

  if (!metadata || !metadata.files) {
    return [];
  }

  return Object.keys(metadata.files);
}

/**
 * Remove file from tracking (e.g., when user deletes it intentionally)
 * @param {string} targetDir - Project directory
 * @param {string} relativePath - Relative path to remove
 * @returns {Promise<void>}
 */
export async function untrackFile(targetDir, relativePath) {
  const metadata = await getMetadata(targetDir);

  if (!metadata || !metadata.files) {
    return;
  }

  delete metadata.files[relativePath];
  await saveMetadata(targetDir, metadata);
}

/**
 * Update file tracking after updating a file
 * @param {string} targetDir - Project directory
 * @param {string} relativePath - Relative path
 * @param {string} newHash - New file hash
 * @param {string} version - New package version
 * @returns {Promise<void>}
 */
export async function updateFileTracking(targetDir, relativePath, newHash, version) {
  const metadata = await getMetadata(targetDir);

  if (!metadata) {
    throw new Error('Cannot update tracking: no metadata exists');
  }

  // Update file metadata
  if (metadata.files[relativePath]) {
    metadata.files[relativePath].hash = newHash;
    metadata.files[relativePath].updated_at = new Date().toISOString();
    metadata.files[relativePath].updated_to_version = version;
  } else {
    // File was added during update
    metadata.files[relativePath] = {
      hash: newHash,
      source: 'npm',
      installed_at: new Date().toISOString()
    };
  }

  // Update package version
  metadata.installed_version = version;
  metadata.last_updated = new Date().toISOString();

  await saveMetadata(targetDir, metadata);
}

/**
 * Check if metadata exists for a project
 * @param {string} targetDir - Project directory
 * @returns {Promise<boolean>}
 */
export async function hasMetadata(targetDir) {
  const metadata = await getMetadata(targetDir);
  return metadata !== null;
}

/**
 * Check if a file path represents user content that should never be auto-updated
 * @param {string} relativePath - Relative file path
 * @returns {boolean} True if user content, false otherwise
 */
export function isUserContent(relativePath) {
  const userPatterns = [
    /^\.claude\/product\//,
    /^\.claude\/agents\/auto-generated\//,
    /^\.agentful\/state\.json$/,
    /^\.agentful\/completion\.json$/,
    /^\.agentful\/decisions\.json$/,
    /^\.agentful\/conversation/,
    /\.local$/,
    /\.backup$/
  ];

  return userPatterns.some(pattern => pattern.test(relativePath));
}

/**
 * Check if a file is a core agentful file that can be updated
 * @param {string} relativePath - Relative file path
 * @returns {boolean} True if core file, false otherwise
 */
export function isCoreFile(relativePath) {
  // Must be in a core directory
  const corePrefixes = [
    '.claude/agents/',
    '.claude/skills/',
    '.claude/commands/',
    'CLAUDE.md'
  ];

  const isInCoreDir = corePrefixes.some(prefix =>
    relativePath.startsWith(prefix) || relativePath === prefix
  );

  // But not user content
  return isInCoreDir && !isUserContent(relativePath);
}

/**
 * Create a comprehensive backup of all agentful files
 * @param {string} targetDir - Target project directory
 * @param {string} reason - Reason for backup (e.g., 'update', 'force-update')
 * @returns {Promise<string>} Path to backup directory
 */
export async function createFullBackup(targetDir, reason = 'update') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const backupPath = path.join(targetDir, BACKUP_DIR, timestamp);

  // Create backup directory
  await fs.mkdir(backupPath, { recursive: true });

  // Get all tracked files from metadata
  const metadata = await getMetadata(targetDir);
  let fileCount = 0;
  const backedUpFiles = [];

  if (metadata && metadata.files) {
    for (const relativePath of Object.keys(metadata.files)) {
      if (!isUserContent(relativePath)) {
        const sourcePath = path.join(targetDir, relativePath);
        const destPath = path.join(backupPath, relativePath);

        try {
          await fs.mkdir(path.dirname(destPath), { recursive: true });
          await fs.copyFile(sourcePath, destPath);
          backedUpFiles.push(relativePath);
          fileCount++;
        } catch (error) {
          console.warn(`Failed to backup ${relativePath}: ${error.message}`);
        }
      }
    }
  }

  // Always backup metadata
  try {
    const metadataSource = path.join(targetDir, METADATA_FILE);
    const metadataDest = path.join(backupPath, METADATA_FILE);
    await fs.mkdir(path.dirname(metadataDest), { recursive: true });
    await fs.copyFile(metadataSource, metadataDest);
    fileCount++;
  } catch {
    // Metadata might not exist yet
  }

  // Create backup manifest
  const manifest = {
    timestamp,
    reason,
    version: metadata?.version || 'unknown',
    file_count: fileCount,
    files: backedUpFiles,
    created_at: new Date().toISOString()
  };

  await fs.writeFile(
    path.join(backupPath, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return backupPath;
}

/**
 * List available backups
 * @param {string} targetDir - Target project directory
 * @returns {Promise<Array>} List of backup info objects
 */
export async function listBackups(targetDir) {
  const backupsPath = path.join(targetDir, BACKUP_DIR);
  const backups = [];

  try {
    const dirs = await fs.readdir(backupsPath);

    for (const dir of dirs) {
      const manifestPath = path.join(backupsPath, dir, 'manifest.json');
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
        backups.push({
          ...manifest,
          path: path.join(backupsPath, dir)
        });
      } catch {
        // Skip directories without valid manifest
      }
    }

    // Sort by timestamp, newest first
    backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  } catch {
    // No backups directory or error reading
  }

  return backups;
}

/**
 * Restore files from a backup
 * @param {string} targetDir - Target project directory
 * @param {string} backupPath - Path to backup directory
 * @returns {Promise<Object>} Restore results
 */
export async function restoreFromBackup(targetDir, backupPath) {
  const manifestPath = path.join(backupPath, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

  let restoredCount = 0;

  for (const relativePath of manifest.files) {
    const sourcePath = path.join(backupPath, relativePath);
    const destPath = path.join(targetDir, relativePath);

    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(sourcePath, destPath);
      restoredCount++;
    } catch (error) {
      console.error(`Failed to restore ${relativePath}: ${error.message}`);
    }
  }

  // Restore metadata last
  const metadataSource = path.join(backupPath, METADATA_FILE);
  const metadataDest = path.join(targetDir, METADATA_FILE);
  try {
    await fs.copyFile(metadataSource, metadataDest);
  } catch {
    // Metadata might not exist in older backups
  }

  return {
    restored: restoredCount,
    total: manifest.files.length,
    version: manifest.version
  };
}

/**
 * Initialize metadata structure (used during init)
 * @param {string} targetDir - Project directory
 * @param {string} version - Package version
 * @returns {Promise<Object>} Initial metadata object
 */
export async function initializeMetadata(targetDir, version) {
  const metadata = {
    version: version,
    installed_version: version,
    installed_at: new Date().toISOString(),
    last_update_check: null,
    last_update_applied: null,
    files: {},
    file_hashes: {},
    update_history: [],
    customization_map: {}
  };

  await saveMetadata(targetDir, metadata);
  return metadata;
}
