/**
 * Output Parser - Structured data extraction from agent responses
 *
 * Parses raw agent output to extract:
 * - JSON blocks (structured data)
 * - Decision points (requiring user input)
 * - Progress markers (completion tracking)
 * - Questions (blocking queries)
 * - Plain text (fallback)
 *
 * @module lib/core/output-parser
 */

/**
 * Main output parser class
 */
export class OutputParser {
  /**
   * Parse agent output and return structured result
   *
   * @param {string} rawOutput - Raw agent response text
   * @returns {ParsedOutput} Parsed output with type and extracted data
   */
  parse(rawOutput) {
    if (!rawOutput || typeof rawOutput !== 'string') {
      return {
        type: 'text',
        data: null,
        raw: rawOutput || ''
      };
    }

    // Try parsing in order of specificity
    const jsonResult = this.extractJSON(rawOutput);
    if (jsonResult.found) {
      return {
        type: 'structured',
        data: jsonResult.data,
        raw: rawOutput,
        jsonBlocks: jsonResult.all
      };
    }

    const decisions = this.extractDecisions(rawOutput);
    if (decisions.length > 0) {
      return {
        type: 'decisions',
        decisions,
        raw: rawOutput
      };
    }

    const progress = this.extractProgress(rawOutput);
    if (progress) {
      return {
        type: 'progress',
        progress,
        raw: rawOutput
      };
    }

    const questions = this.extractQuestions(rawOutput);
    if (questions.length > 0) {
      return {
        type: 'question',
        questions,
        raw: rawOutput
      };
    }

    return {
      type: 'text',
      data: rawOutput.trim(),
      raw: rawOutput
    };
  }

  /**
   * Extract JSON from markdown code blocks or inline JSON
   *
   * @param {string} text - Text containing potential JSON
   * @returns {Object} { found: boolean, data: object|null, all: array }
   */
  extractJSON(text) {
    const result = {
      found: false,
      data: null,
      all: []
    };

    // Pattern 1: Markdown JSON code blocks
    const codeBlockPattern = /```(?:json)?\s*\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockPattern.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        result.all.push(parsed);
        if (!result.found) {
          result.data = parsed;
          result.found = true;
        }
      } catch (e) {
        // Not valid JSON, skip
      }
    }

    // Pattern 2: Inline JSON objects (if no code blocks found)
    if (!result.found) {
      const inlinePattern = /(\{[\s\S]*?\})/g;

      while ((match = inlinePattern.exec(text)) !== null) {
        try {
          const parsed = JSON.parse(match[1]);
          // Verify it's a real object (not just {})
          if (Object.keys(parsed).length > 0) {
            result.all.push(parsed);
            if (!result.found) {
              result.data = parsed;
              result.found = true;
            }
          }
        } catch (e) {
          // Not valid JSON, skip
        }
      }
    }

    return result;
  }

  /**
   * Extract decision points from agent output
   *
   * Format:
   * DECISION: Question text?
   * OPTIONS:
   * - Option A (description)
   * - Option B (description)
   *
   * @param {string} text - Text containing decisions
   * @returns {Array<Decision>} Array of decision objects
   */
  extractDecisions(text) {
    const decisions = [];

    // Pattern: DECISION: ... OPTIONS: ...
    const decisionPattern = /DECISION:\s*([^\n]+)\s*(?:OPTIONS?:)?\s*((?:[-*]\s*[^\n]+\n?)*)/gi;
    let match;

    while ((match = decisionPattern.exec(text)) !== null) {
      const question = match[1].trim();
      const optionsText = match[2].trim();

      // Parse options
      const options = [];
      const optionPattern = /[-*]\s*([^\n(]+)(?:\(([^)]+)\))?/g;
      let optionMatch;

      while ((optionMatch = optionPattern.exec(optionsText)) !== null) {
        options.push({
          value: optionMatch[1].trim(),
          description: optionMatch[2]?.trim() || null
        });
      }

      decisions.push({
        question,
        options: options.length > 0 ? options : null,
        context: this._extractContext(text, match.index)
      });
    }

    // Alternative pattern: Simple "DECIDE: " marker
    const simplePattern = /DECIDE:\s*([^\n]+)/gi;

    while ((match = simplePattern.exec(text)) !== null) {
      const question = match[1].trim();

      // Don't duplicate if already found
      if (!decisions.some(d => d.question === question)) {
        decisions.push({
          question,
          options: null,
          context: this._extractContext(text, match.index)
        });
      }
    }

    return decisions;
  }

  /**
   * Extract progress indicators from text
   *
   * Patterns:
   * - [PROGRESS: 50%]
   * - Progress: 7/10 tests passing
   * - 3 of 5 features complete
   *
   * @param {string} text - Text containing progress markers
   * @returns {Progress|null} Progress object or null
   */
  extractProgress(text) {
    // Pattern 1: [PROGRESS: 50%]
    const bracketPattern = /\[PROGRESS:\s*(\d+)%\]/i;
    let match = bracketPattern.exec(text);

    if (match) {
      return {
        percentage: parseInt(match[1], 10),
        format: 'percentage',
        raw: match[0]
      };
    }

    // Pattern 2: Progress: 7/10 tests passing
    const ratioPattern = /Progress:\s*(\d+)\s*\/\s*(\d+)\s*([^\n]*)/i;
    match = ratioPattern.exec(text);

    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      return {
        current,
        total,
        percentage: total > 0 ? Math.round((current / total) * 100) : 0,
        format: 'ratio',
        description: match[3].trim() || null,
        raw: match[0]
      };
    }

    // Pattern 3: 3 of 5 features complete
    const ofPattern = /(\d+)\s+of\s+(\d+)\s+([^\n]*?)\s+(?:complete|done|finished|passing)/i;
    match = ofPattern.exec(text);

    if (match) {
      const current = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      return {
        current,
        total,
        percentage: total > 0 ? Math.round((current / total) * 100) : 0,
        format: 'of',
        description: match[3].trim() || null,
        raw: match[0]
      };
    }

    // Pattern 4: Simple percentage
    const percentPattern = /(\d+)%\s+(?:complete|done|finished)/i;
    match = percentPattern.exec(text);

    if (match) {
      return {
        percentage: parseInt(match[1], 10),
        format: 'percentage',
        raw: match[0]
      };
    }

    return null;
  }

  /**
   * Extract questions requiring user input
   *
   * Patterns:
   * - Lines ending with "?"
   * - "QUESTION: " prefix
   * - "Need input: " prefix
   *
   * @param {string} text - Text containing questions
   * @returns {Array<Question>} Array of question objects
   */
  extractQuestions(text) {
    const questions = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and code blocks
      if (!line || line.startsWith('```')) continue;

      // Pattern 1: Explicit QUESTION: marker
      let match = /^QUESTION:\s*(.+)$/i.exec(line);
      if (match) {
        questions.push({
          question: match[1].trim(),
          type: 'explicit',
          line: i + 1,
          context: this._getLineContext(lines, i)
        });
        continue;
      }

      // Pattern 2: "Need input:" prefix
      match = /^(?:Need input|Needs? input|Input needed):\s*(.+)$/i.exec(line);
      if (match) {
        questions.push({
          question: match[1].trim(),
          type: 'input_request',
          line: i + 1,
          context: this._getLineContext(lines, i)
        });
        continue;
      }

      // Pattern 3: Questions ending with "?"
      // Only consider substantial questions (>10 chars, starts with question word or context)
      if (line.endsWith('?') && line.length > 10) {
        const questionWords = /^(what|where|when|why|how|which|who|should|can|could|would|will|is|are|do|does)/i;
        if (questionWords.test(line)) {
          questions.push({
            question: line,
            type: 'inferred',
            line: i + 1,
            context: this._getLineContext(lines, i)
          });
        }
      }
    }

    return questions;
  }

  /**
   * Extract surrounding context for a match
   *
   * @private
   * @param {string} text - Full text
   * @param {number} index - Match index
   * @param {number} radius - Characters before/after to include
   * @returns {string} Context snippet
   */
  _extractContext(text, index, radius = 100) {
    const start = Math.max(0, index - radius);
    const end = Math.min(text.length, index + radius);

    let context = text.substring(start, end).trim();

    // Add ellipsis if truncated
    if (start > 0) context = '...' + context;
    if (end < text.length) context = context + '...';

    return context;
  }

  /**
   * Get context lines around a specific line
   *
   * @private
   * @param {Array<string>} lines - All lines
   * @param {number} lineIndex - Target line index
   * @param {number} radius - Lines before/after to include
   * @returns {Array<string>} Context lines
   */
  _getLineContext(lines, lineIndex, radius = 2) {
    const start = Math.max(0, lineIndex - radius);
    const end = Math.min(lines.length, lineIndex + radius + 1);
    return lines.slice(start, end);
  }
}

/**
 * Convenience function for parsing agent output
 *
 * @param {string} rawOutput - Raw agent response
 * @returns {ParsedOutput} Parsed output
 */
export function parseAgentOutput(rawOutput) {
  const parser = new OutputParser();
  return parser.parse(rawOutput);
}

/**
 * Extract only JSON from agent output
 *
 * @param {string} text - Text containing JSON
 * @returns {Object} { found: boolean, data: object|null, all: array }
 */
export function extractJSON(text) {
  const parser = new OutputParser();
  return parser.extractJSON(text);
}

/**
 * Extract only decisions from agent output
 *
 * @param {string} text - Text containing decisions
 * @returns {Array<Decision>} Array of decisions
 */
export function extractDecisions(text) {
  const parser = new OutputParser();
  return parser.extractDecisions(text);
}

/**
 * Extract only progress from agent output
 *
 * @param {string} text - Text containing progress markers
 * @returns {Progress|null} Progress object or null
 */
export function extractProgress(text) {
  const parser = new OutputParser();
  return parser.extractProgress(text);
}

/**
 * Extract only questions from agent output
 *
 * @param {string} text - Text containing questions
 * @returns {Array<Question>} Array of questions
 */
export function extractQuestions(text) {
  const parser = new OutputParser();
  return parser.extractQuestions(text);
}

/**
 * @typedef {Object} ParsedOutput
 * @property {'structured'|'decisions'|'progress'|'question'|'text'} type - Output type
 * @property {*} data - Extracted data (type-specific)
 * @property {string} raw - Original raw output
 */

/**
 * @typedef {Object} Decision
 * @property {string} question - Decision question
 * @property {Array<Option>|null} options - Available options (if provided)
 * @property {string} context - Surrounding text context
 */

/**
 * @typedef {Object} Option
 * @property {string} value - Option value
 * @property {string|null} description - Option description
 */

/**
 * @typedef {Object} Progress
 * @property {number} percentage - Progress as percentage (0-100)
 * @property {'percentage'|'ratio'|'of'} format - Format type
 * @property {number} [current] - Current count (for ratio/of formats)
 * @property {number} [total] - Total count (for ratio/of formats)
 * @property {string|null} [description] - Progress description
 * @property {string} raw - Raw progress marker
 */

/**
 * @typedef {Object} Question
 * @property {string} question - Question text
 * @property {'explicit'|'input_request'|'inferred'} type - Question detection type
 * @property {number} line - Line number in output
 * @property {Array<string>} context - Surrounding lines for context
 */
