/**
 * Canvas Manager Tests
 */

import { describe, it, expect } from 'vitest';
import {
  domToCanvasElement,
  canvasElementToHTML,
  parseHTMLToElements,
  findElementById,
  getElementPath,
} from '@/services/canvas/canvas-manager';
import type { CanvasElement } from '@/types/canvas';

describe('CanvasManager', () => {
  describe('domToCanvasElement', () => {
    it('should convert simple DOM element to CanvasElement', () => {
      const div = document.createElement('div');
      div.id = 'test-id';
      div.className = 'test-class';
      div.textContent = 'Test content';

      const canvasElement = domToCanvasElement(div);

      expect(canvasElement.tagName).toBe('div');
      expect(canvasElement.id).toBe('test-id');
      expect(canvasElement.attributes.id).toBe('test-id');
      expect(canvasElement.attributes.class).toBe('test-class');
      expect(canvasElement.content).toBe('Test content');
      expect(canvasElement.children).toHaveLength(0);
    });

    it('should convert nested DOM elements', () => {
      const parent = document.createElement('div');
      parent.id = 'parent';

      const child = document.createElement('p');
      child.textContent = 'Child content';
      parent.appendChild(child);

      const canvasElement = domToCanvasElement(parent);

      expect(canvasElement.tagName).toBe('div');
      expect(canvasElement.children).toHaveLength(1);
      expect(canvasElement.children[0].tagName).toBe('p');
      expect(canvasElement.children[0].content).toBe('Child content');
    });

    it('should extract computed styles', () => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.padding = '10px';

      const canvasElement = domToCanvasElement(div);

      expect(canvasElement.styles.display).toBeDefined();
      expect(canvasElement.styles.padding).toBeDefined();
    });
  });

  describe('canvasElementToHTML', () => {
    it('should convert simple CanvasElement to HTML', () => {
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'div',
        attributes: { class: 'test-class', id: 'test' },
        styles: { display: 'flex', padding: '10px' },
        children: [],
      };

      const html = canvasElementToHTML(element);

      expect(html).toContain('<div');
      expect(html).toContain('class="test-class"');
      expect(html).toContain('id="test"');
      expect(html).toContain('style=');
      expect(html).toContain('display: flex');
      expect(html).toContain('padding: 10px');
      expect(html).toContain('data-canvas-id="test-1"');
    });

    it('should convert element with content to HTML', () => {
      const element: CanvasElement = {
        id: 'test-1',
        tagName: 'p',
        attributes: {},
        styles: {},
        children: [],
        content: 'Test content',
      };

      const html = canvasElementToHTML(element);

      expect(html).toContain('<p');
      expect(html).toContain('Test content');
      expect(html).toContain('</p>');
    });

    it('should convert nested elements to HTML', () => {
      const element: CanvasElement = {
        id: 'parent-1',
        tagName: 'div',
        attributes: {},
        styles: {},
        children: [
          {
            id: 'child-1',
            tagName: 'p',
            attributes: {},
            styles: {},
            children: [],
            content: 'Child content',
          },
        ],
      };

      const html = canvasElementToHTML(element);

      expect(html).toContain('<div');
      expect(html).toContain('<p');
      expect(html).toContain('Child content');
      expect(html).toContain('</p>');
      expect(html).toContain('</div>');
    });
  });

  describe('parseHTMLToElements', () => {
    it('should parse HTML string to CanvasElement array', () => {
      const html = '<div class="test">Content</div>';

      const elements = parseHTMLToElements(html);

      expect(elements).toHaveLength(1);
      expect(elements[0].tagName).toBe('div');
      expect(elements[0].attributes.class).toBe('test');
      expect(elements[0].content).toBe('Content');
    });

    it('should parse multiple root elements', () => {
      const html = '<div>First</div><p>Second</p>';

      const elements = parseHTMLToElements(html);

      expect(elements).toHaveLength(2);
      expect(elements[0].tagName).toBe('div');
      expect(elements[1].tagName).toBe('p');
    });

    it('should parse nested HTML', () => {
      const html = '<div><p>Nested content</p></div>';

      const elements = parseHTMLToElements(html);

      expect(elements).toHaveLength(1);
      expect(elements[0].children).toHaveLength(1);
      expect(elements[0].children[0].tagName).toBe('p');
      expect(elements[0].children[0].content).toBe('Nested content');
    });
  });

  describe('findElementById', () => {
    it('should find element by ID in flat tree', () => {
      const elements: CanvasElement[] = [
        {
          id: 'test-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [],
        },
        {
          id: 'test-2',
          tagName: 'p',
          attributes: {},
          styles: {},
          children: [],
        },
      ];

      const found = findElementById(elements, 'test-2');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('test-2');
      expect(found?.tagName).toBe('p');
    });

    it('should find element by ID in nested tree', () => {
      const elements: CanvasElement[] = [
        {
          id: 'parent-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [
            {
              id: 'child-1',
              tagName: 'p',
              attributes: {},
              styles: {},
              children: [],
            },
          ],
        },
      ];

      const found = findElementById(elements, 'child-1');

      expect(found).not.toBeNull();
      expect(found?.id).toBe('child-1');
    });

    it('should return null if element not found', () => {
      const elements: CanvasElement[] = [
        {
          id: 'test-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [],
        },
      ];

      const found = findElementById(elements, 'not-found');

      expect(found).toBeNull();
    });
  });

  describe('getElementPath', () => {
    it('should return path for root element', () => {
      const elements: CanvasElement[] = [
        {
          id: 'parent-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [],
        },
      ];

      const path = getElementPath(elements, 'parent-1');

      expect(path).toEqual(['parent-1']);
    });

    it('should return path for nested element', () => {
      const elements: CanvasElement[] = [
        {
          id: 'parent-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [
            {
              id: 'child-1',
              tagName: 'p',
              attributes: {},
              styles: {},
              children: [],
            },
          ],
        },
      ];

      const path = getElementPath(elements, 'child-1');

      expect(path).toEqual(['parent-1', 'child-1']);
    });

    it('should return null for non-existent element', () => {
      const elements: CanvasElement[] = [
        {
          id: 'test-1',
          tagName: 'div',
          attributes: {},
          styles: {},
          children: [],
        },
      ];

      const path = getElementPath(elements, 'not-found');

      expect(path).toBeNull();
    });
  });
});
