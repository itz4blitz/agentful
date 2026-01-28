/**
 * PropertyField Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PropertyField } from '../property-field';
import type { PropertyField as PropertyFieldType } from '@/types/inspector';

describe('PropertyField', () => {
  const mockField: PropertyFieldType = {
    id: 'test-field',
    label: 'Test Field',
    type: 'text',
    value: 'test value',
    defaultValue: 'default',
  };

  const defaultProps = {
    field: mockField,
    value: 'test value',
    onChange: vi.fn(),
    onReset: vi.fn(),
    hasChange: false,
  };

  describe('Text Input', () => {
    it('should render text input', () => {
      render(<PropertyField {...defaultProps} />);

      expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    });

    it('should call onChange when input changes', () => {
      render(<PropertyField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'new value' } });

      expect(defaultProps.onChange).toHaveBeenCalledWith('new value');
    });

    it('should show changed indicator when hasChange is true', () => {
      render(<PropertyField {...defaultProps} hasChange={true} />);

      expect(screen.getByText('(changed)')).toBeInTheDocument();
    });
  });

  describe('Number Input', () => {
    it('should render number input', () => {
      const numberField = { ...mockField, type: 'number' as const, value: 42 };
      render(<PropertyField {...defaultProps} field={numberField} value={42} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(42);
    });

    it('should respect min and max constraints', () => {
      const numberField = {
        ...mockField,
        type: 'number' as const,
        value: 50,
        min: 0,
        max: 100,
      };
      render(<PropertyField {...defaultProps} field={numberField} value={50} />);

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Textarea', () => {
    it('should render textarea', () => {
      const textareaField = { ...mockField, type: 'textarea' as const };
      render(<PropertyField {...defaultProps} field={textareaField} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });
  });

  describe('Select', () => {
    it('should render select dropdown', () => {
      const selectField = {
        ...mockField,
        type: 'select' as const,
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' },
        ],
      };

      render(<PropertyField {...defaultProps} field={selectField} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });
  });

  describe('Checkbox/Switch', () => {
    it('should render switch for checkbox type', () => {
      const checkboxField = { ...mockField, type: 'checkbox' as const, value: true };
      render(<PropertyField {...defaultProps} field={checkboxField} value={true} />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toBeInTheDocument();
      expect(switchElement).toBeChecked();
    });

    it('should toggle switch on click', () => {
      const checkboxField = { ...mockField, type: 'checkbox' as const, value: true };
      render(<PropertyField {...defaultProps} field={checkboxField} value={true} />);

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(defaultProps.onChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Slider', () => {
    it('should render slider', () => {
      const sliderField = {
        ...mockField,
        type: 'slider' as const,
        value: 0.5,
        min: 0,
        max: 1,
        step: 0.01,
      };

      render(<PropertyField {...defaultProps} field={sliderField} value={0.5} />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });
  });

  describe('Color Input', () => {
    it('should render color picker', () => {
      const colorField = { ...mockField, type: 'color' as const, value: '#ff0000' };
      render(<PropertyField {...defaultProps} field={colorField} value="#ff0000" />);

      expect(screen.getByText('#ff0000')).toBeInTheDocument();
    });
  });

  describe('Reset Button', () => {
    it('should show reset button when hasChange is true', () => {
      render(<PropertyField {...defaultProps} hasChange={true} />);

      const resetButton = screen.getByLabelText(/Reset Test Field to default/);
      expect(resetButton).toBeInTheDocument();
    });

    it('should call onReset when reset button is clicked', () => {
      render(<PropertyField {...defaultProps} hasChange={true} />);

      const resetButton = screen.getByLabelText(/Reset Test Field to default/);
      fireEvent.click(resetButton);

      expect(defaultProps.onReset).toHaveBeenCalled();
    });

    it('should not show reset button when hasChange is false', () => {
      render(<PropertyField {...defaultProps} hasChange={false} />);

      const resetButton = screen.queryByLabelText(/Reset/);
      expect(resetButton).not.toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('should show field description when provided', () => {
      const fieldWithDesc = { ...mockField, description: 'This is a helpful description' };
      render(<PropertyField {...defaultProps} field={fieldWithDesc} />);

      expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
    });
  });

  describe('Validation', () => {
    it('should call validation function before updating', () => {
      const validationError = 'Value is invalid';
      const fieldWithValidation = {
        ...mockField,
        validation: vi.fn(() => validationError),
      };

      render(<PropertyField {...defaultProps} field={fieldWithValidation} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'invalid' } });

      expect(fieldWithValidation.validation).toHaveBeenCalledWith('invalid');
      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });
  });
});
