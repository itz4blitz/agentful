/**
 * ResizableLayout Tests
 */

import { render, screen } from '@/test/setup';
import { ResizableLayout } from '../resizable-layout';

describe('ResizableLayout', () => {
  it('should render 3-panel layout on desktop', () => {
    render(
      <ResizableLayout
        chatPanel={<div>Chat Panel</div>}
        canvasPanel={<div>Canvas Panel</div>}
        componentsPanel={<div>Components Panel</div>}
      />
    );

    expect(screen.getByText('Chat Panel')).toBeInTheDocument();
    expect(screen.getByText('Canvas Panel')).toBeInTheDocument();
    expect(screen.getByText('Components Panel')).toBeInTheDocument();
  });

  it('should render tabs on mobile', () => {
    // Mock window.innerWidth to simulate mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <ResizableLayout
        chatPanel={<div>Chat Panel</div>}
        canvasPanel={<div>Canvas Panel</div>}
        componentsPanel={<div>Components Panel</div>}
      />
    );

    // Check for tabs
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /canvas/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /components/i })).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <ResizableLayout
        chatPanel={<div>Chat Panel</div>}
        canvasPanel={<div>Canvas Panel</div>}
        componentsPanel={<div>Components Panel</div>}
      />
    );

    const layout = screen.getByRole('group', { name: /main editor layout/i }) || document.querySelector('[aria-label*="Main editor layout"]');
    expect(layout).toBeInTheDocument();
  });

  it('should render separators between panels', () => {
    render(
      <ResizableLayout
        chatPanel={<div>Chat Panel</div>}
        canvasPanel={<div>Canvas Panel</div>}
        componentsPanel={<div>Components Panel</div>}
      />
    );

    const separators = screen.getAllByRole('separator');
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ResizableLayout
        chatPanel={<div>Chat Panel</div>}
        canvasPanel={<div>Canvas Panel</div>}
        componentsPanel={<div>Components Panel</div>}
        className="custom-layout"
      />
    );

    const layout = container.querySelector('.custom-layout');
    expect(layout).toBeInTheDocument();
  });
});
