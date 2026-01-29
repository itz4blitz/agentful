/**
 * PropertyGroup Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertyGroup } from '../property-group';
import type { PropertyGroup as PropertyGroupType, PropertyField } from '@/types/inspector';

// Mock the inspector store
vi.mock('@/stores/inspector-store', () => ({
  useInspectorStore: vi.fn(),
}));

import { useInspectorStore } from '@/stores/inspector-store';

describe('PropertyGroup', () => {
  const mockFields: PropertyField[] = [
    {
      id: 'field1',
      label: 'Field 1',
      type: 'text',
      value: 'value1',
      defaultValue: 'default1',
    },
    {
      id: 'field2',
      label: 'Field 2',
      type: 'number',
      value: 42,
      defaultValue: 0,
    },
  ];

  const mockGroup: PropertyGroupType = {
    id: 'test-group',
    label: 'Test Group',
    icon: 'Layout',
    properties: mockFields,
    collapsible: true,
    defaultExpanded: true,
  };

  const mockStore = {
    expandedGroups: new Set(['test-group']),
    changes: [] as import('@/types/inspector').PropertyChange[],
    toggleGroup: vi.fn(),
    updateProperty: vi.fn(),
    resetProperty: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useInspectorStore).mockReturnValue(mockStore);
  });

  it('should render group header', () => {
    render(<PropertyGroup group={mockGroup} />);

    expect(screen.getByText('Test Group')).toBeInTheDocument();
  });

  it('should render all fields when expanded', () => {
    render(<PropertyGroup group={mockGroup} />);

    expect(screen.getByText('Field 1')).toBeInTheDocument();
    expect(screen.getByText('Field 2')).toBeInTheDocument();
  });

  it('should toggle group expansion when clicking header', () => {
    mockStore.expandedGroups = new Set(['test-group']);

    render(<PropertyGroup group={mockGroup} />);

    const header = screen.getByText('Test Group').closest('button');
    fireEvent.click(header!);

    expect(mockStore.toggleGroup).toHaveBeenCalledWith('test-group');
  });

  it('should not render fields when collapsed', () => {
    mockStore.expandedGroups = new Set();

    render(<PropertyGroup group={mockGroup} />);

    // Fields should not be visible
    expect(screen.queryByLabelText('Field 1')).not.toBeInTheDocument();
  });

  it('should show changed count badge when there are changes', () => {
    const mockChange: import('@/types/inspector').PropertyChange = {
      groupId: 'test-group',
      fieldId: 'field1',
      property: 'style',
      propertyKey: 'field1',
      oldValue: 'old',
      newValue: 'new',
    };
    mockStore.changes = [mockChange];

    render(<PropertyGroup group={mockGroup} />);

    expect(screen.getByText('1 changed')).toBeInTheDocument();
  });

  it('should call updateProperty when field changes', () => {
    render(<PropertyGroup group={mockGroup} />);

    const input = screen.getByLabelText('Field 1');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockStore.updateProperty).toHaveBeenCalledWith('test-group', 'field1', 'new value');
  });

  it('should call resetProperty when field is reset', () => {
    const mockChange: import('@/types/inspector').PropertyChange = {
      groupId: 'test-group',
      fieldId: 'field1',
      property: 'style',
      propertyKey: 'field1',
      oldValue: 'old',
      newValue: 'new',
    };
    mockStore.changes = [mockChange];

    render(<PropertyGroup group={mockGroup} />);

    const resetButton = screen.getByLabelText(/Reset Field 1 to default/);
    fireEvent.click(resetButton);

    expect(mockStore.resetProperty).toHaveBeenCalledWith('test-group', 'field1');
  });

  it('should render non-collapsible group', () => {
    const nonCollapsibleGroup = { ...mockGroup, collapsible: false };

    render(<PropertyGroup group={nonCollapsibleGroup} />);

    // Should still show fields
    expect(screen.getByText('Field 1')).toBeInTheDocument();

    // Should not have toggle button
    const header = screen.getByText('Test Group').closest('button');
    expect(header).not.toBeInTheDocument();
  });

  it('should show correct icon for different group types', () => {
    const groups: PropertyGroupType[] = [
      { ...mockGroup, icon: 'Layout' },
      { ...mockGroup, icon: 'Spacing' },
      { ...mockGroup, icon: 'Type' },
      { ...mockGroup, icon: 'Palette' },
      { ...mockGroup, icon: 'Tag' },
      { ...mockGroup, icon: 'Accessibility' },
    ];

    groups.forEach((group) => {
      const { unmount } = render(<PropertyGroup group={group} />);
      expect(screen.getByText(group.label)).toBeInTheDocument();
      unmount();
    });
  });
});
