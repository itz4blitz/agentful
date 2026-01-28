/**
 * Canvas Manager
 * Service for DOM traversal, manipulation, and element selection
 */

import type {
  CanvasElement,
  ElementPosition,
  CanvasPostMessage,
} from '@/types/canvas';

/**
 * Convert DOM element to CanvasElement
 */
export const domToCanvasElement = (element: Element): CanvasElement => {
  const canvasElement: CanvasElement = {
    id: element.getAttribute('data-canvas-id') || element.id || generateId(),
    tagName: element.tagName.toLowerCase(),
    attributes: {},
    styles: {},
    children: [],
  };

  // Extract attributes
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    if (attr.name !== 'data-canvas-id') {
      canvasElement.attributes[attr.name] = attr.value;
    }
  }

  // Extract computed styles
  const computed = window.getComputedStyle(element);
  const styleProperties = [
    'display',
    'position',
    'width',
    'height',
    'margin',
    'padding',
    'backgroundColor',
    'color',
    'fontSize',
    'fontWeight',
    'textAlign',
    'flexDirection',
    'justifyContent',
    'alignItems',
    'gridTemplateColumns',
    'gridTemplateRows',
    'gap',
  ];

  styleProperties.forEach((prop) => {
    const value = computed.getPropertyValue(prop);
    if (value) {
      canvasElement.styles[prop] = value;
    }
  });

  // Extract text content
  if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
    canvasElement.content = element.textContent || undefined;
  }

  // Process children
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    canvasElement.children.push(domToCanvasElement(child));
  }

  return canvasElement;
};

/**
 * Generate unique ID for elements
 */
const generateId = (): string => {
  return `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Parse HTML string to CanvasElement tree
 */
export const parseHTMLToElements = (html: string): CanvasElement[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: CanvasElement[] = [];

  for (let i = 0; i < doc.body.children.length; i++) {
    elements.push(domToCanvasElement(doc.body.children[i]));
  }

  return elements;
};

/**
 * Convert CanvasElement tree to HTML string
 */
export const canvasElementToHTML = (element: CanvasElement): string => {
  const attributes = Object.entries(element.attributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  const styles = Object.entries(element.styles)
    .map(([key, value]) => `${camelToKebab(key)}: ${value}`)
    .join('; ');

  let html = `<${element.tagName}`;

  if (attributes) {
    html += ` ${attributes}`;
  }

  if (styles) {
    html += ` style="${styles}"`;
  }

  html += ` data-canvas-id="${element.id}"`;

  if (element.children.length === 0 && element.content) {
    html += `>${element.content}</${element.tagName}>`;
  } else if (element.children.length > 0) {
    html += '>';
    element.children.forEach((child) => {
      html += canvasElementToHTML(child);
    });
    html += `</${element.tagName}>`;
  } else {
    html += '></' + element.tagName + '>';
  }

  return html;
};

/**
 * Convert camelCase to kebab-case
 */
const camelToKebab = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Find element by ID in tree
 */
export const findElementById = (
  elements: CanvasElement[],
  id: string
): CanvasElement | null => {
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }
    if (element.children.length > 0) {
      const found = findElementById(element.children, id);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get element path in tree
 */
export const getElementPath = (
  elements: CanvasElement[],
  id: string,
  path: string[] = []
): string[] | null => {
  for (const element of elements) {
    if (element.id === id) {
      return [...path, element.id];
    }
    if (element.children.length > 0) {
      const found = getElementPath(element.children, id, [...path, element.id]);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Get element position relative to viewport
 */
export const getElementPosition = (
  element: HTMLElement
): ElementPosition => {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
};

/**
 * Inject canvas styles into iframe
 */
export const injectCanvasStyles = (iframe: HTMLIFrameElement): void => {
  const doc = iframe.contentDocument;
  if (!doc) return;

  const styleId = 'canvas-editor-styles';
  let styleEl = doc.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = doc.createElement('style');
    styleEl.id = styleId;
    doc.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Don't outline the root element or body */
    [data-canvas-id="root"],
    body[data-canvas-id],
    html[data-canvas-id] {
      outline: none !important;
    }

    /* Only outline non-root elements when selected/hovered */
    [data-canvas-selected]:not([data-canvas-id="root"]):not(body):not(html),
    [data-canvas-hovered]:not([data-canvas-id="root"]):not(body):not(html) {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px;
    }

    [data-canvas-hovered]:not([data-canvas-id="root"]):not(body):not(html) {
      outline-color: #93c5fd !important;
    }

    /* Position relative only for non-root, non-body elements */
    [data-canvas-id]:not([data-canvas-id="root"]):not(body):not(html) {
      position: relative;
    }

    /* Tag labels - positioned properly to avoid layout issues */
    [data-canvas-id]:not([data-canvas-id="root"]):not(body):not(html)::after {
      content: attr(data-canvas-tag);
      position: absolute;
      top: 0;
      left: 0;
      transform: translateY(-100%);
      background: rgba(59, 130, 246, 0.9);
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px 4px 0 0;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      z-index: 1000;
      white-space: nowrap;
      font-family: system-ui, sans-serif;
      line-height: 1;
    }

    /* Show tag labels on hover or selection */
    [data-canvas-hovered]:not([data-canvas-id="root"]):not(body):not(html)::after,
    [data-canvas-selected]:not([data-canvas-id="root"]):not(body):not(html)::after {
      opacity: 1;
    }
  `;
};

/**
 * Initialize canvas iframe with content
 */
export const initCanvasIframe = (
  iframe: HTMLIFrameElement,
  html: string,
  onMessage?: (message: CanvasPostMessage) => void
): void => {
  const doc = iframe.contentDocument;
  if (!doc) return;

  // Write HTML content
  doc.open();
  doc.write(html);
  doc.close();

  // Inject styles
  injectCanvasStyles(iframe);

  // Add event listeners for element interaction
  doc.body.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const canvasId = target.closest('[data-canvas-id]')?.getAttribute('data-canvas-id');
    if (canvasId && onMessage) {
      onMessage({
        type: 'select-element',
        payload: { elementId: canvasId },
      });
    }
  });

  doc.body.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const canvasId = target.closest('[data-canvas-id]')?.getAttribute('data-canvas-id');
    if (canvasId && onMessage) {
      onMessage({
        type: 'hover-element',
        payload: { elementId: canvasId },
      });
    }
  });

  doc.body.addEventListener('mouseout', (e) => {
    const target = e.target as HTMLElement;
    const canvasId = target.closest('[data-canvas-id]')?.getAttribute('data-canvas-id');
    if (canvasId && onMessage) {
      onMessage({
        type: 'hover-element',
        payload: { elementId: null },
      });
    }
  });
};

/**
 * Select element in iframe
 */
export const selectElementInIframe = (
  iframe: HTMLIFrameElement,
  elementId: string | null
): void => {
  const doc = iframe.contentDocument;
  if (!doc) return;

  // Clear previous selection
  doc.querySelectorAll('[data-canvas-selected]').forEach((el) => {
    el.removeAttribute('data-canvas-selected');
  });

  if (elementId) {
    const element = doc.querySelector(`[data-canvas-id="${elementId}"]`);
    if (element) {
      element.setAttribute('data-canvas-selected', 'true');
    }
  }
};

/**
 * Hover element in iframe
 */
export const hoverElementInIframe = (
  iframe: HTMLIFrameElement,
  elementId: string | null
): void => {
  const doc = iframe.contentDocument;
  if (!doc) return;

  // Clear previous hover
  doc.querySelectorAll('[data-canvas-hovered]').forEach((el) => {
    el.removeAttribute('data-canvas-hovered');
  });

  if (elementId) {
    const element = doc.querySelector(`[data-canvas-id="${elementId}"]`);
    if (element) {
      element.setAttribute('data-canvas-hovered', 'true');
    }
  }
};

/**
 * Update element in iframe
 */
export const updateElementInIframe = (
  iframe: HTMLIFrameElement,
  elementId: string,
  updates: Partial<CanvasElement>
): void => {
  const doc = iframe.contentDocument;
  if (!doc) return;

  const element = doc.querySelector(`[data-canvas-id="${elementId}"]`) as HTMLElement;
  if (!element) return;

  // Update attributes
  if (updates.attributes) {
    Object.entries(updates.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }

  // Update styles
  if (updates.styles) {
    Object.entries(updates.styles).forEach(([key, value]) => {
      (element.style as CSSStyleDeclaration)[key] = value;
    });
  }

  // Update content
  if (updates.content !== undefined) {
    element.textContent = updates.content;
  }
};

/**
 * Setup MutationObserver to track DOM changes
 */
export const setupMutationObserver = (
  iframe: HTMLIFrameElement,
  callback: () => void
): MutationObserver | null => {
  const doc = iframe.contentDocument;
  if (!doc) return null;

  const observer = new MutationObserver(() => {
    callback();
  });

  observer.observe(doc.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  return observer;
};
