/**
 * Canvas Utilities
 * Helper functions for canvas operations
 */

import type { CanvasElement } from '@/types/canvas';

/**
 * Flatten a nested element tree into a single array
 */
export function flattenElements(elements: CanvasElement[]): CanvasElement[] {
  const result: CanvasElement[] = [];

  const flatten = (items: CanvasElement[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children && item.children.length > 0) {
        flatten(item.children);
      }
    }
  };

  flatten(elements);
  return result;
}

/**
 * Find an element by ID in a nested tree
 */
export function findElementById(
  elements: CanvasElement[],
  id: string
): CanvasElement | null {
  for (const element of elements) {
    if (element.id === id) {
      return element;
    }
    if (element.children && element.children.length > 0) {
      const found = findElementById(element.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Get the path to an element as an array of IDs
 */
export function getElementPath(
  elements: CanvasElement[],
  id: string,
  path: string[] = []
): string[] | null {
  for (const element of elements) {
    if (element.id === id) {
      return [...path, id];
    }
    if (element.children && element.children.length > 0) {
      const found = getElementPath(element.children, id, [...path, element.id]);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

/**
 * Get all parent IDs for an element
 */
export function getParentIds(
  elements: CanvasElement[],
  id: string
): string[] {
  const path = getElementPath(elements, id);
  if (!path) {
    return [];
  }
  return path.slice(0, -1); // Exclude the element itself
}
