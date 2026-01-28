/**
 * Drop Indicator
 * Service for rendering visual drop indicators during drag operations
 */

import type { DropPosition } from '@/types/dnd';

/**
 * Drop indicator configuration
 */
export interface DropIndicatorConfig {
  color?: string;
  width?: number;
  offset?: number;
  zIndex?: number;
}

/**
 * Default indicator config
 */
const DEFAULT_CONFIG: Required<DropIndicatorConfig> = {
  color: '#3b82f6',
  width: 3,
  offset: 4,
  zIndex: 9999,
};

/**
 * Create drop indicator element
 */
export const createDropIndicator = (
  config: DropIndicatorConfig = {}
): HTMLElement => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const indicator = document.createElement('div');
  indicator.style.position = 'absolute';
  indicator.style.backgroundColor = finalConfig.color;
  indicator.style.zIndex = String(finalConfig.zIndex);
  indicator.style.pointerEvents = 'none';
  indicator.style.transition = 'all 0.15s ease-out';
  indicator.style.opacity = '0';
  indicator.setAttribute('data-drop-indicator', 'true');

  return indicator;
};

/**
 * Position drop indicator based on target and position
 */
export const positionDropIndicator = (
  indicator: HTMLElement,
  targetElement: HTMLElement,
  position: DropPosition,
  config: DropIndicatorConfig = {}
): void => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const rect = targetElement.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  // Reset inline styles
  indicator.style.width = '';
  indicator.style.height = '';

  switch (position) {
    case 'before':
      indicator.style.top = `${rect.top + scrollTop - finalConfig.offset}px`;
      indicator.style.left = `${rect.left + scrollLeft}px`;
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${finalConfig.width}px`;
      break;

    case 'after':
      indicator.style.top = `${rect.bottom + scrollTop + finalConfig.offset}px`;
      indicator.style.left = `${rect.left + scrollLeft}px`;
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${finalConfig.width}px`;
      break;

    case 'inside':
      indicator.style.top = `${rect.top + scrollTop}px`;
      indicator.style.left = `${rect.left + scrollLeft}px`;
      indicator.style.width = `${rect.width}px`;
      indicator.style.height = `${rect.height}px`;
      indicator.style.border = `${finalConfig.width}px solid ${finalConfig.color}`;
      indicator.style.backgroundColor = 'transparent';
      break;
  }

  // Show indicator
  indicator.style.opacity = '1';
};

/**
 * Hide drop indicator
 */
export const hideDropIndicator = (indicator: HTMLElement): void => {
  indicator.style.opacity = '0';
};

/**
 * Remove drop indicator from DOM
 */
export const removeDropIndicator = (indicator: HTMLElement): void => {
  indicator.remove();
};

/**
 * Get or create drop indicator container
 */
export const getIndicatorContainer = (): HTMLElement => {
  let container = document.querySelector('[data-drop-indicator-container]') as HTMLElement;

  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-drop-indicator-container', 'true');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9998';
    document.body.appendChild(container);
  }

  return container;
};

/**
 * Setup drop indicator system
 */
export const setupDropIndicator = (
  config: DropIndicatorConfig = {}
): HTMLElement => {
  const container = getIndicatorContainer();
  const indicator = createDropIndicator(config);
  container.appendChild(indicator);

  return indicator;
};

/**
 * Teardown drop indicator system
 */
export const teardownDropIndicator = (): void => {
  const container = document.querySelector('[data-drop-indicator-container]');
  if (container) {
    container.remove();
  }
};
