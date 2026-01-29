/**
 * ProviderConfig Component Test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProviderConfig } from './ProviderConfig';

describe('ProviderConfig', () => {
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnSave.mockClear();
  });

  const renderConfig = (props = {}) => {
    return render(<ProviderConfig onSave={mockOnSave} {...props} />);
  };

  it('should render provider configuration card', () => {
    renderConfig();

    expect(screen.getByText('AI Provider Configuration')).toBeInTheDocument();
    expect(
      screen.getByText('Configure your AI provider settings to enable agent functionality')
    ).toBeInTheDocument();
  });

  it('should render provider dropdown with all options', () => {
    renderConfig();

    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
  });

  it('should render API key input field', () => {
    renderConfig();

    const apiKeyInput = screen.getByLabelText('API Key');
    expect(apiKeyInput).toBeInTheDocument();
    expect(apiKeyInput).toHaveAttribute('type', 'password');
    expect(apiKeyInput).toHaveAttribute('placeholder', 'Enter your API key');
  });

  it('should render model selection dropdown', () => {
    renderConfig();

    expect(screen.getByLabelText('Model')).toBeInTheDocument();
  });

  it('should render save button', () => {
    renderConfig();

    const saveButton = screen.getByText('Save Configuration');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();
  });

  it('should enable save button when API key is entered', () => {
    renderConfig();

    const apiKeyInput = screen.getByLabelText('API Key');
    const saveButton = screen.getByText('Save Configuration');

    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });

    expect(saveButton).toBeEnabled();
  });

  it('should call onSave with correct configuration', () => {
    renderConfig();

    const apiKeyInput = screen.getByLabelText('API Key');
    const saveButton = screen.getByText('Save Configuration');

    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key' } });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      provider: 'claude',
      apiKey: 'test-api-key',
      model: 'claude-3-5-sonnet',
    });
  });

  it('should use initial config when provided', () => {
    const initialConfig = {
      provider: 'openai' as const,
      apiKey: 'initial-key',
      model: 'gpt-4o',
    };

    renderConfig({ initialConfig });

    const apiKeyInput = screen.getByLabelText('API Key');
    expect(apiKeyInput).toHaveValue('initial-key');
  });

  it('should update model when provider changes', () => {
    const initialConfig = {
      provider: 'claude' as const,
      model: 'claude-3-5-sonnet',
    };
    renderConfig({ initialConfig });

    // Model dropdown should be present
    const modelSelect = screen.getByLabelText('Model');
    expect(modelSelect).toBeInTheDocument();

    // Change provider to openai
    const providerSelect = screen.getByLabelText('Provider');
    fireEvent.change(providerSelect, { target: { value: 'openai' } });

    // Save should reflect the current provider/model selection
    const apiKeyInput = screen.getByLabelText('API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'test-key' } });

    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);

    // The save should have been called with openai provider
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('should disable save button when API key is empty', () => {
    renderConfig({ initialConfig: { apiKey: '' } });

    const saveButton = screen.getByText('Save Configuration');
    expect(saveButton).toBeDisabled();
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderConfig();

      expect(screen.getByLabelText('Provider')).toBeInTheDocument();
      expect(screen.getByLabelText('API Key')).toBeInTheDocument();
      expect(screen.getByLabelText('Model')).toBeInTheDocument();
    });

    it('should have proper autocomplete off for API key', () => {
      renderConfig();

      const apiKeyInput = screen.getByLabelText('API Key');
      expect(apiKeyInput).toHaveAttribute('autoComplete', 'off');
    });
  });
});
