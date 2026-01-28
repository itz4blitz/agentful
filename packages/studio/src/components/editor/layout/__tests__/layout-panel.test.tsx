/**
 * LayoutPanel Tests
 */

import { render, screen } from '@/test/setup';
import userEvent from '@testing-library/user-event';
import { LayoutPanel } from '../layout-panel';

describe('LayoutPanel', () => {
  it('should render panel content', () => {
    render(
      <LayoutPanel panelId="chat" defaultSize={25}>
        <div>Panel Content</div>
      </LayoutPanel>
    );
    expect(screen.getByText('Panel Content')).toBeInTheDocument();
  });

  it('should hide content when collapsed', () => {
    render(
      <LayoutPanel panelId="chat" defaultSize={25} isCollapsed>
        <div>Panel Content</div>
      </LayoutPanel>
    );
    const panelContent = screen.getByText('Panel Content').parentElement;
    expect(panelContent).toHaveClass('hidden');
  });

  it('should show collapse button on hover', async () => {
    const user = userEvent.setup();
    render(
      <LayoutPanel panelId="chat" defaultSize={25} showCollapseButton>
        <div>Panel Content</div>
      </LayoutPanel>
    );

    const container = screen.getByText('Panel Content').closest('.relative');
    await user.hover(container!);

    const collapseButton = screen.getByRole('button', { name: /collapse chat panel/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('should call onToggleCollapse when button is clicked', async () => {
    const user = userEvent.setup();
    const onToggleCollapse = vi.fn();

    render(
      <LayoutPanel
        panelId="chat"
        defaultSize={25}
        isCollapsed
        onToggleCollapse={onToggleCollapse}
        showCollapseButton
      >
        <div>Panel Content</div>
      </LayoutPanel>
    );

    const expandButton = screen.getByRole('button', { name: /expand chat panel/i });
    await user.click(expandButton);

    expect(onToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('should have proper accessibility attributes', () => {
    render(
      <LayoutPanel panelId="canvas" defaultSize={50}>
        <div>Canvas Panel</div>
      </LayoutPanel>
    );

    const panel = screen.getByRole('region', { name: /canvas panel/i }) || document.getElementById('canvas-panel');
    expect(panel).toBeInTheDocument();
  });

  it('should apply collapse direction correctly', () => {
    render(
      <>
        <LayoutPanel panelId="chat" defaultSize={25} collapseDirection="left" isCollapsed showCollapseButton>
          <div>Left Panel</div>
        </LayoutPanel>
        <LayoutPanel panelId="components" defaultSize={25} collapseDirection="right" isCollapsed showCollapseButton>
          <div>Right Panel</div>
        </LayoutPanel>
      </>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });
});
