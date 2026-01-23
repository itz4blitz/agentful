const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Creates a temporary test directory with a unique name
 * @param {string} [prefix='test-'] - Prefix for the directory name
 * @returns {string} Absolute path to the created directory
 */
function createTestDir(prefix = 'test-') {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return tmpDir;
}

/**
 * Recursively removes a directory and all its contents
 * @param {string} dir - Directory path to remove
 */
function cleanupTestDir(dir) {
  if (!dir || !fs.existsSync(dir)) {
    return;
  }

  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    // Fallback for older Node versions
    if (error.code === 'ERR_FS_RMDIR_ENOTEMPTY' || !fs.rmSync) {
      const rimraf = (dirPath) => {
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath).forEach((file) => {
            const curPath = path.join(dirPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
              rimraf(curPath);
            } else {
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(dirPath);
        }
      };
      rimraf(dir);
    } else {
      throw error;
    }
  }
}

/**
 * Creates a test directory manager with automatic cleanup
 * @param {string} [prefix='test-'] - Prefix for the directory name
 * @returns {{dir: string, cleanup: function}} Object with directory path and cleanup function
 */
function createTestDirManager(prefix = 'test-') {
  const dir = createTestDir(prefix);
  return {
    dir,
    cleanup: () => cleanupTestDir(dir)
  };
}

module.exports = {
  createTestDir,
  cleanupTestDir,
  createTestDirManager
};
