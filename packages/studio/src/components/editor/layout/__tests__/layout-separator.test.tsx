/**
 * LayoutSeparator Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LayoutSeparator } from '../layout-separator';

describe('LayoutSeparator', () => {
  it('should render horizontal separator', () => {
    render(<LayoutSeparator />);
    const separator = screen.getByRole('separator');
    expect(separator).toBeInTheDocument();
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('should render vertical separator', () => {
    render(<LayoutSeparator direction="vertical" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('should render with handle by default', () => {
    render(<LayoutSeparator />);
    const handle = screen.getByRole('separator').querySelector('div');
    expect(handle).toBeInTheDocument();
  });

  it('should not render handle when withHandle is false', () => {
    render(<LayoutSeparator withHandle={false} />);
    const handle = screen.getByRole('separator').querySelector('div');
    expect(handle).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(<LayoutSeparator />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-label', 'Resize panel');
  });

  it('should apply custom className', () => {
    render(<LayoutSeparator className="custom-class" />);
    const separator = screen.getByRole('separator');
    expect(separator).toHaveClass('custom-class');
  });
});
