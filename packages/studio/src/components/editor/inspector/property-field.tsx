/**
 * PropertyField
 * Individual property editor component
 */

import * as React from 'react';
import { RotateCcw } from 'lucide-react';
import type { PropertyField as PropertyFieldType } from '@/types/inspector';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription, FieldContent } from '@/components/ui/field';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface PropertyFieldProps {
  field: PropertyFieldType;
  value: unknown;
  onChange: (value: unknown) => void;
  onReset: () => void;
  hasChange: boolean;
}

export const PropertyField = React.memo(
  ({ field, value, onChange, onReset, hasChange }: PropertyFieldProps) => {
    const EMPTY_SELECT_VALUE = '__empty__';

    const handleChange = React.useCallback(
      (newValue: unknown) => {
        // Validate if validation function provided
        if (field.validation) {
          const error = field.validation(newValue);
          if (error) {
            console.warn(`Validation error for ${field.id}:`, error);
            return;
          }
        }
        onChange(newValue);
      },
      [field, onChange]
    );

    const renderInput = () => {
      switch (field.type) {
        case 'text':
          return (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={cn(
                'h-8 text-sm',
                hasChange && 'border-primary'
              )}
            />
          );

        case 'number':
          return (
            <Input
              type="number"
              value={typeof value === 'number' ? value : parseFloat(String(value)) || 0}
              onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
              min={field.min}
              max={field.max}
              step={field.step}
              className={cn(
                'h-8 text-sm',
                hasChange && 'border-primary'
              )}
            />
          );

        case 'textarea':
          return (
            <Textarea
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={cn(
                'text-sm resize-none',
                hasChange && 'border-primary'
              )}
            />
          );

        case 'select':
          return (
            <Select
              value={value === '' ? EMPTY_SELECT_VALUE : String(value ?? '')}
              onValueChange={(nextValue) =>
                handleChange(nextValue === EMPTY_SELECT_VALUE ? '' : nextValue)
              }
            >
              <SelectTrigger
                className={cn(
                  'h-8 text-sm',
                  hasChange && 'border-primary'
                )}
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value === '' ? EMPTY_SELECT_VALUE : option.value}
                  >
                    {option.icon && <span className="mr-2">{option.icon}</span>}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'checkbox':
          return (
            <Switch
              checked={value as boolean}
              onCheckedChange={(checked) => handleChange(checked)}
              className={hasChange ? 'data-[state=checked]:bg-primary' : ''}
            />
          );

        case 'slider': {
          const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
          return (
            <div className="flex items-center gap-2 flex-1">
              <Slider
                value={[numValue]}
                onValueChange={([v]) => handleChange(v)}
                min={field.min ?? 0}
                max={field.max ?? 100}
                step={field.step ?? 1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {typeof value === 'number' ? value.toFixed(2) : String(value)}
                {field.unit}
              </span>
            </div>
          );
        }

        case 'color': {
          const colorValue = typeof value === 'string' ? value : '#000000';
          const triggerButton = (
            <Button
              variant="outline"
              className={cn(
                'h-8 w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground',
                hasChange && 'border-primary'
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="h-4 w-4 rounded border border-border"
                  style={{ backgroundColor: colorValue }}
                />
                <span className="text-sm">{colorValue || 'Select color'}</span>
              </div>
            </Button>
          );

          return (
            <Popover>
              <PopoverTrigger asChild>
                {triggerButton}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-2">
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(e) => handleChange(e.target.value)}
                    className="h-20 w-full cursor-pointer rounded border"
                  />
                  <Input
                    type="text"
                    value={colorValue}
                    onChange={(e) => handleChange(e.target.value)}
                    placeholder="#000000"
                    className="h-8 text-sm"
                  />
                </div>
              </PopoverContent>
            </Popover>
          );
        }

        case 'font':
          return (
            <Select value={String(value ?? '')} onValueChange={handleChange}>
              <SelectTrigger
                className={cn(
                  'h-8 text-sm',
                  hasChange && 'border-primary'
                )}
              >
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span style={{ fontFamily: option.value }}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'spacing':
          // For now, treat as text input. Future enhancement: visual spacing editor
          return (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || '0, 8px, 1rem'}
              className={cn(
                'h-8 text-sm',
                hasChange && 'border-primary'
              )}
            />
          );

        case 'border':
          // For now, treat as text input. Future enhancement: visual border editor
          return (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder || '0'}
              className={cn(
                'h-8 text-sm',
                hasChange && 'border-primary'
              )}
            />
          );

        default:
          return (
            <Input
              type="text"
              value={value as string}
              onChange={(e) => handleChange(e.target.value)}
              className={cn(
                'h-8 text-sm',
                hasChange && 'border-primary'
              )}
            />
          );
      }
    };

    return (
      <Field orientation="vertical" className="group/field">
        <div className="flex items-start justify-between gap-2">
          <FieldLabel className="text-sm">
            {field.label}
            {hasChange && (
              <span className="ml-1 text-xs text-primary">(changed)</span>
            )}
          </FieldLabel>
          {hasChange && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover/field:opacity-100 transition-opacity"
              onClick={onReset}
              aria-label={`Reset ${field.label} to default`}
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          )}
        </div>
        <FieldContent>
          {renderInput()}
          {field.description && (
            <FieldDescription>{field.description}</FieldDescription>
          )}
        </FieldContent>
      </Field>
    );
  }
);

PropertyField.displayName = 'PropertyField';
