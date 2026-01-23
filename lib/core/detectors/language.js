import fs from 'fs/promises';
import path from 'path';

/**
 * Language Detector
 *
 * Detects programming languages used in the project based on:
 * - File extensions
 * - File content analysis
 * - Configuration files
 */

/**
 * Language detection rules
 * Maps file extensions to languages
 */
const LANGUAGE_EXTENSIONS = {
  '.js': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.jsx': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.go': 'Go',
  '.rs': 'Rust',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.h': 'C',
  '.hpp': 'C++',
  '.swift': 'Swift',
  '.kt': 'Kotlin',
  '.scala': 'Scala',
  '.r': 'R',
  '.jl': 'Julia',
  '.lua': 'Lua',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell'
};

/**
 * Language detection from config files
 */
const CONFIG_FILES = {
  'tsconfig.json': 'TypeScript',
  'jsconfig.json': 'JavaScript',
  'package.json': 'JavaScript',
  'requirements.txt': 'Python',
  'setup.py': 'Python',
  'Pipfile': 'Python',
  'pyproject.toml': 'Python',
  'go.mod': 'Go',
  'Cargo.toml': 'Rust',
  'pom.xml': 'Java',
  'build.gradle': 'Java',
  'Gemfile': 'Ruby',
  'composer.json': 'PHP'
};

/**
 * Detect languages from file list
 *
 * @param {string[]} files - Array of file paths relative to project root
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Promise<Object[]>} Array of detected languages with confidence scores
 */
export async function detectLanguages(files, projectRoot) {
  const languageCounts = {};
  const configEvidence = {};

  // Count files by extension
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const language = LANGUAGE_EXTENSIONS[ext];

    if (language) {
      if (!languageCounts[language]) {
        languageCounts[language] = { files: 0, extensions: new Set() };
      }
      languageCounts[language].files++;
      languageCounts[language].extensions.add(ext);
    }

    // Check for config files
    const basename = path.basename(file);
    const configLang = CONFIG_FILES[basename];
    if (configLang) {
      configEvidence[configLang] = (configEvidence[configLang] || 0) + 1;
    }
  }

  // Calculate confidence scores
  const totalFiles = files.length;
  const languages = [];

  for (const [language, data] of Object.entries(languageCounts)) {
    const filePercentage = (data.files / totalFiles) * 100;
    const configBonus = configEvidence[language] ? 10 : 0;
    const extensionDiversity = data.extensions.size > 1 ? 5 : 0;

    let confidence = Math.min(95, Math.round(filePercentage * 0.8 + configBonus + extensionDiversity));

    // TypeScript bonus: if tsconfig.json exists
    if (language === 'TypeScript' && configEvidence['TypeScript']) {
      confidence = Math.min(95, confidence + 10);
    }

    languages.push({
      name: language,
      confidence,
      files: data.files,
      percentage: Math.round(filePercentage * 10) / 10,
      extensions: Array.from(data.extensions)
    });
  }

  // Sort by file count descending
  languages.sort((a, b) => b.files - a.files);

  return languages;
}

/**
 * Detect primary language (highest confidence)
 *
 * @param {Object[]} languages - Array of detected languages
 * @returns {Object|null} Primary language or null if none detected
 */
export function getPrimaryLanguage(languages) {
  if (languages.length === 0) return null;

  // Return language with highest confidence
  return languages.reduce((prev, current) =>
    current.confidence > prev.confidence ? current : prev
  );
}

/**
 * Analyze language-specific patterns in content
 *
 * @param {string} content - File content to analyze
 * @param {string} language - Language to check for
 * @returns {Object} Pattern detection result
 */
export function analyzeLanguagePatterns(content, language) {
  const patterns = {
    TypeScript: {
      features: [
        { name: 'interfaces', regex: /interface\s+\w+/g },
        { name: 'types', regex: /type\s+\w+\s*=/g },
        { name: 'generics', regex: /<[A-Z]\w*>/g },
        { name: 'decorators', regex: /@\w+/g }
      ]
    },
    JavaScript: {
      features: [
        { name: 'async/await', regex: /async\s+function|await\s+/g },
        { name: 'arrow functions', regex: /=>\s*{|=>\s*\w+/g },
        { name: 'destructuring', regex: /const\s*{[^}]+}\s*=/g },
        { name: 'template literals', regex: /`[^`]*\${[^}]*}[^`]*`/g }
      ]
    },
    Python: {
      features: [
        { name: 'classes', regex: /class\s+\w+:/g },
        { name: 'decorators', regex: /@\w+/g },
        { name: 'list comprehensions', regex: /\[[^\]]+for\s+\w+\s+in\s+[^\]]+\]/g },
        { name: 'type hints', regex: /:\s*\w+\s*(?:=|\))/g }
      ]
    }
  };

  const langPatterns = patterns[language];
  if (!langPatterns) {
    return { detected: false };
  }

  const detected = {};
  for (const { name, regex } of langPatterns.features) {
    const matches = content.match(regex);
    detected[name] = matches ? matches.length : 0;
  }

  return {
    detected: true,
    features: detected
  };
}

export default {
  detectLanguages,
  getPrimaryLanguage,
  analyzeLanguagePatterns
};
