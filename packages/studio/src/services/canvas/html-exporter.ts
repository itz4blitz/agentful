/**
 * HTML Exporter
 * Service for exporting canvas elements to clean HTML
 */

import type { CanvasElement } from '@/types/canvas';
import { canvasElementToHTML } from './canvas-manager';

/**
 * Export options
 */
export interface ExportOptions {
  inlineStyles?: boolean;
  includeDataAttributes?: boolean;
  format?: boolean;
  minify?: boolean;
}

/**
 * Export canvas elements to HTML string
 */
export const exportToHTML = (
  elements: CanvasElement[],
  options: ExportOptions = {}
): string => {
  const {
    includeDataAttributes = false,
    format = true,
    minify = false,
  } = options;

  let html = elements.map((el) => canvasElementToHTML(el)).join('\n');

  // Remove internal data attributes if not needed
  if (!includeDataAttributes) {
    html = html.replace(/\s*data-canvas-id="[^"]*"/g, '');
    html = html.replace(/\s*data-canvas-tag="[^"]*"/g, '');
    html = html.replace(/\s*data-canvas-selected="true"/g, '');
    html = html.replace(/\s*data-canvas-hovered="true"/g, '');
  }

  // Remove data-canvas-tag labels from before pseudo-elements
  // These are handled by CSS, not in HTML

  if (minify) {
    // Minify HTML
    html = html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  } else if (format) {
    // Pretty print HTML
    html = formatHTML(html);
  }

  return html;
};

/**
 * Export to full HTML document
 */
export const exportToFullDocument = (
  elements: CanvasElement[],
  options: ExportOptions = {}
): string => {
  const bodyContent = exportToHTML(elements, options);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
    }
  </style>
</head>
<body>
${bodyContent}
</body>
</html>`;
};

/**
 * Format HTML with proper indentation
 */
const formatHTML = (html: string): string => {
  let formatted = '';
  let indent = 0;
  const tab = '  ';

  // Split by tags
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

  for (const token of tokens) {
    if (token.match(/<\/\w/)) {
      // Closing tag
      indent = Math.max(0, indent - 1);
      formatted += tab.repeat(indent) + token + '\n';
    } else if (token.match(/<\w[^>]*[^/]>/)) {
      // Opening tag
      formatted += tab.repeat(indent) + token + '\n';
      if (!token.match(/\/>/)) {
        // Not self-closing
        indent++;
      }
    } else {
      // Text content
      const trimmed = token.trim();
      if (trimmed) {
        formatted += tab.repeat(indent) + trimmed + '\n';
      }
    }
  }

  return formatted.trim();
};

/**
 * Export to React component
 */
export const exportToReactComponent = (
  elements: CanvasElement[],
  componentName = 'ExportedComponent'
): string => {
  const bodyContent = exportToHTML(elements, {
    inlineStyles: true,
    includeDataAttributes: false,
    format: false,
  });

  // Convert HTML to JSX
  const jsx = htmlToJSX(bodyContent);

  return `import React from 'react';

export const ${componentName}: React.FC = () => {
  return (
${indentJSX(jsx, 4)}
  );
};

export default ${componentName};`;
};

/**
 * Convert HTML string to JSX
 */
const htmlToJSX = (html: string): string => {
  let jsx = html;

  // Replace class with className
  jsx = jsx.replace(/\sclass=/g, ' className=');

  // Replace self-closing tags
  jsx = jsx.replace(/<br\s*\/?>/g, '<br />');
  jsx = jsx.replace(/<hr\s*\/?>/g, '<hr />');
  jsx = jsx.replace(/<img\s*([^>]*?)>/g, '<img $1 />');
  jsx = jsx.replace(/<input\s*([^>]*?)>/g, '<input $1 />');

  // Replace style attribute
  jsx = jsx.replace(/style="([^"]*)"/g, (_, styles) => {
    const styleObject = styles
      .split(';')
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const [key, value] = s.split(':').map((part: string) => part.trim());
        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return `${camelKey}: '${value}'`;
      })
      .join(', ');
    return `style={{ ${styleObject} }}`;
  });

  return jsx;
};

/**
 * Indent JSX code
 */
const indentJSX = (jsx: string, spaces: number): string => {
  const indent = ' '.repeat(spaces);
  let indented = '';
  let currentIndent = 0;

  const lines = jsx.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.match(/^<\/\w/)) {
      currentIndent = Math.max(0, currentIndent - 1);
    }

    indented += indent.repeat(currentIndent) + trimmed + '\n';

    if (trimmed.match(/<\w[^>]*[^/]>/) && !trimmed.match(/<\/\w/)) {
      currentIndent++;
    }
  }

  return indented.trimEnd();
};

/**
 * Get export statistics
 */
export const getExportStats = (elements: CanvasElement[]) => {
  let totalElements = 0;
  let totalText = 0;
  const tagCounts: Record<string, number> = {};

  const countElements = (element: CanvasElement) => {
    totalElements++;
    tagCounts[element.tagName] = (tagCounts[element.tagName] || 0) + 1;

    if (element.content) {
      totalText += element.content.length;
    }

    element.children.forEach(countElements);
  };

  elements.forEach(countElements);

  return {
    totalElements,
    totalCharacters: totalText,
    tagCounts,
  };
};
