#!/usr/bin/env node

/**
 * Similar Documentation Detector (Cross-platform)
 *
 * Detects if similar markdown files already exist.
 * Equivalent to the complex bash find/grep/sed command.
 *
 * Original bash:
 * if [ "$FILE" = "*.md" ]; then
 *   existing=$(find . -name '*.md' -not -path './node_modules/*' -not -path './.git/*' |
 *     xargs grep -l "$(basename '$FILE' | sed 's/_/ /g' | sed 's/.md$//' | head -c 30)" 2>/dev/null |
 *     grep -v "$FILE" | head -1)
 *   if [ -n "$existing" ]; then
 *     echo "⚠️  Similar doc exists: $existing - consider updating instead"
 *   fi
 * fi
 *
 * Input: Reads tool_input JSON from stdin (Claude Code hook standard)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const MAX_SEARCH_LENGTH = 30;

// Read input from stdin (Claude Code hook standard)
async function readInput() {
  return new Promise((resolve) => {
    let input = '';
    const rl = readline.createInterface({ input: process.stdin });
    rl.on('line', (line) => { input += line; });
    rl.on('close', () => {
      try {
        resolve(JSON.parse(input));
      } catch {
        resolve({});
      }
    });
  });
}

// Main execution
(async () => {
  const input = await readInput();
  const filePath = input?.tool_input?.file_path || input?.parameters?.file_path || '';

  // Only check markdown files
  if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) {
    process.exit(0);
  }

  // Extract search term from filename
  const basename = path.basename(filePath);
  const nameWithoutExt = basename.replace(/\.mdx?$/, '');
  const searchTerm = nameWithoutExt.replace(/_/g, ' ').substring(0, MAX_SEARCH_LENGTH);

  if (!searchTerm.trim()) {
    process.exit(0);
  }

  // Recursively find all .md files, excluding node_modules and .git
  function findMarkdownFiles(dir, files = []) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        if (entry.name === 'node_modules') continue;

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          findMarkdownFiles(fullPath, files);
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
          files.push(fullPath);
        }
      }
    } catch {
      // Ignore permission errors
    }
    return files;
  }

  // Check if file contains search term
  function fileContainsSearchTerm(file, term) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return content.toLowerCase().includes(term.toLowerCase());
    } catch {
      return false;
    }
  }

  // Find similar files
  const allMdFiles = findMarkdownFiles(process.cwd());
  const normalizedTargetPath = path.normalize(filePath);

  for (const file of allMdFiles) {
    const normalizedFile = path.normalize(file);

    // Skip the file being edited
    if (normalizedFile === normalizedTargetPath) continue;

    // Check if this file contains the search term
    if (fileContainsSearchTerm(file, searchTerm)) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`⚠️  Similar doc exists: ${relativePath} - consider updating instead`);
      break; // Only report first match
    }
  }

  process.exit(0);
})();
