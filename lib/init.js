import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = path.join(__dirname, '..', 'template');
const CLAUDE_DIR = path.join(__dirname, '..', '.claude');

/**
 * Initialize agentful in a target project directory
 * @param {string} targetDir - Target project directory
 * @param {Object} options - Initialization options
 * @param {boolean} options.includeProduct - Whether to include PRODUCT.md template
 * @returns {Promise<{success: boolean, files: string[]}>}
 */
export async function initProject(targetDir, options = {}) {
  const { includeProduct = false } = options;
  const createdFiles = [];

  try {
    // Ensure target directory exists
    await fs.access(targetDir);

    // 1. Copy .claude/ directory (agents, skills, commands)
    const claudeTargetDir = path.join(targetDir, '.claude');

    try {
      await fs.access(CLAUDE_DIR);
      await copyDirectory(CLAUDE_DIR, claudeTargetDir);
      createdFiles.push('.claude/');
    } catch (err) {
      // .claude directory doesn't exist in package, skip
    }

    // 2. Copy CLAUDE.md template
    const claudeMdSource = path.join(TEMPLATE_DIR, 'CLAUDE.md');
    const claudeMdTarget = path.join(targetDir, 'CLAUDE.md');

    try {
      await fs.access(claudeMdSource);
      await fs.copyFile(claudeMdSource, claudeMdTarget);
      createdFiles.push('CLAUDE.md');
    } catch (err) {
      // CLAUDE.md template doesn't exist, skip
    }

    // 3. Create .agentful/ directory with state files
    const agentfulDir = path.join(targetDir, '.agentful');
    await fs.mkdir(agentfulDir, { recursive: true });
    createdFiles.push('.agentful/');

    // Create state.json
    const stateFile = path.join(agentfulDir, 'state.json');
    const initialState = {
      initialized: new Date().toISOString(),
      version: '1.0.0',
      agents: [],
      skills: []
    };
    await fs.writeFile(stateFile, JSON.stringify(initialState, null, 2));
    createdFiles.push('.agentful/state.json');

    // Create completion.json
    const completionFile = path.join(agentfulDir, 'completion.json');
    const initialCompletion = {
      agents: {},
      skills: {},
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(completionFile, JSON.stringify(initialCompletion, null, 2));
    createdFiles.push('.agentful/completion.json');

    // Create decisions.json
    const decisionsFile = path.join(agentfulDir, 'decisions.json');
    const initialDecisions = {
      decisions: [],
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(decisionsFile, JSON.stringify(initialDecisions, null, 2));
    createdFiles.push('.agentful/decisions.json');

    // 4. Optionally copy PRODUCT.md template
    if (includeProduct) {
      const productMdSource = path.join(TEMPLATE_DIR, 'PRODUCT.md');
      const productMdTarget = path.join(targetDir, 'PRODUCT.md');

      try {
        await fs.access(productMdSource);
        await fs.copyFile(productMdSource, productMdTarget);
        createdFiles.push('PRODUCT.md');
      } catch (err) {
        // PRODUCT.md template doesn't exist, skip
      }
    }

    return {
      success: true,
      files: createdFiles
    };
  } catch (error) {
    throw new Error(`Failed to initialize project: ${error.message}`);
  }
}

/**
 * Recursively copy a directory
 * @param {string} src - Source directory
 * @param {string} dest - Destination directory
 */
export async function copyDirectory(src, dest) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectory
      await copyDirectory(srcPath, destPath);
    } else {
      // Copy file
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Check if project is already initialized
 * @param {string} targetDir - Target project directory
 * @returns {Promise<boolean>}
 */
export async function isInitialized(targetDir) {
  const agentfulDir = path.join(targetDir, '.agentful');
  const stateFile = path.join(agentfulDir, 'state.json');

  try {
    await fs.access(stateFile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get current state from .agentful/state.json
 * @param {string} targetDir - Target project directory
 * @returns {Promise<Object|null>}
 */
export async function getState(targetDir) {
  const stateFile = path.join(targetDir, '.agentful', 'state.json');

  try {
    const content = await fs.readFile(stateFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}
