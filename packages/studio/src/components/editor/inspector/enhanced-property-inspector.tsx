/**
 * Enhanced Property Inspector
 * Full prop control for shadcn components with variant/size/state management
 */

import * as React from 'react';
import {
  Settings2,
  X,
  Check,
  RotateCcw,
  Trash2,
  Palette,
  Layers,
  ChevronDown,
  Plus,
  Eye,
} from 'lucide-react';
import { useShadcnPaletteStore } from '@/stores/shadcn-palette-store';
import { useCanvasStore } from '@/stores/canvas-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { ComponentDefinition, PropDefinition } from '@/types/component-system';
import type { CanvasElement } from '@/types/canvas';

interface EnhancedPropertyInspectorProps {
  className?: string;
}

export const EnhancedPropertyInspector = React.memo(
  ({ className }: EnhancedPropertyInspectorProps) => {
    const { selectedElement, updateElement } = useCanvasStore();
    const { getComponentById } = useShadcnPaletteStore();
    
    const [activeTab, setActiveTab] = React.useState('props');
    const [localProps, setLocalProps] = React.useState<Record<string, any>>({});
    const [localStyles, setLocalStyles] = React.useState<Record<string, string>>({});
    const [hasChanges, setHasChanges] = React.useState(false);

    // Get component definition
    const componentDef = React.useMemo(() => {
      if (!selectedElement?.componentId) return null;
      return getComponentById(selectedElement.componentId);
    }, [selectedElement?.componentId, getComponentById]);

    // Initialize local state when selection changes
    React.useEffect(() => {
      if (selectedElement) {
        setLocalProps(selectedElement.props || {});
        setLocalStyles(selectedElement.styles || {});
        setHasChanges(false);
      }
    }, [selectedElement?.id]);

    // Apply changes to canvas
    const handleApply = React.useCallback(() => {
      if (!selectedElement) return;
      
      updateElement(selectedElement.id, {
        props: localProps,
        styles: localStyles,
      });
      
      setHasChanges(false);
    }, [selectedElement, localProps, localStyles, updateElement]);

    // Reset to defaults
    const handleReset = React.useCallback(() => {
      if (!componentDef) return;
      
      setLocalProps(componentDef.defaultProps);
      setLocalStyles({});
      setHasChanges(true);
    }, [componentDef]);

    // Update a single prop
    const updateProp = React.useCallback((name: string, value: any) => {
      setLocalProps(prev => ({ ...prev, [name]: value }));
      setHasChanges(true);
    }, []);

    // Update a style
    const updateStyle = React.useCallback((property: string, value: string) => {
      setLocalStyles(prev => ({ ...prev, [property]: value }));
      setHasChanges(true);
    }, []);

    // Empty state
    if (!selectedElement) {
      return (
        <div
          className={cn('flex flex-col h-full min-h-0 bg-background', className)}
          aria-label="Property inspector"
        >
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Settings2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-sm mb-1">No element selected</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Select a component on the canvas to edit its properties
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn('flex flex-col h-full min-h-0 bg-background', className)}
        aria-label="Property inspector"
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {componentDef?.name || selectedElement.tagName}
              </code>
              {selectedElement.props?.id && (
                <>
                  <span className="text-xs text-muted-foreground">#</span>
                  <code className="text-xs font-mono text-muted-foreground">
                    {selectedElement.props.id}
                  </code>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => useCanvasStore.getState().setSelectedElement(null)}
              aria-label="Deselect"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-3 pt-3">
            <TabsList className="grid w-full grid-cols-3 h-8">
              <TabsTrigger value="props" className="text-xs">
                <Layers className="h-3.5 w-3.5 mr-1" />
                Properties
              </TabsTrigger>
              <TabsTrigger value="styles" className="text-xs">
                <Palette className="h-3.5 w-3.5 mr-1" />
                Styles
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Props Tab */}
          <TabsContent value="props" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-4">
                {componentDef ? (
                  // Render component props
                  componentDef.props.map((prop) => (
                    <PropField
                      key={prop.name}
                      prop={prop}
                      value={localProps[prop.name]}
                      onChange={(value) => updateProp(prop.name, value)}
                    />
                  ))
                ) : (
                  // Generic HTML attributes
                  <GenericProps
                    props={localProps}
                    onChange={updateProp}
                  />
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Styles Tab */}
          <TabsContent value="styles" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <StyleEditor
                styles={localStyles}
                onChange={updateStyle}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        {hasChanges && (
          <>
            <Separator />
            <div className="flex items-center justify-between p-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="gap-1.5 text-xs h-7"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleApply}
                className="gap-1.5 text-xs h-7"
              >
                <Check className="h-3.5 w-3.5" />
                Apply
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }
);

EnhancedPropertyInspector.displayName = 'EnhancedPropertyInspector';

/**
 * Individual prop field renderer
 */
function PropField({
  prop,
  value,
  onChange,
}: {
  prop: PropDefinition;
  value: any;
  onChange: (value: any) => void;
}) {
  const { type, name, label, options, min, max, step, placeholder } = prop;

  switch (type) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <Switch
            id={name}
            checked={!!value}
            onCheckedChange={onChange}
          />
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger id={name} className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options?.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <div className="flex items-center gap-2">
            <Input
              id={name}
              type="number"
              value={value ?? ''}
              onChange={(e) => onChange(Number(e.target.value))}
              min={min}
              max={max}
              step={step}
              className="h-8 text-xs"
            />
          </div>
        </div>
      );

    case 'color':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <div className="flex items-center gap-2">
            <input
              id={name}
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
      );

    default: // string
      return (
        <div className="space-y-1.5">
          <Label htmlFor={name} className="text-xs">{label}</Label>
          <Input
            id={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 text-xs"
          />
        </div>
      );
  }
}

/**
 * Generic HTML props for non-shadcn components
 */
function GenericProps({
  props,
  onChange,
}: {
  props: Record<string, any>;
  onChange: (name: string, value: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">ID</Label>
        <Input
          value={props.id || ''}
          onChange={(e) => onChange('id', e.target.value)}
          placeholder="element-id"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Class Name</Label>
        <Input
          value={props.className || ''}
          onChange={(e) => onChange('className', e.target.value)}
          placeholder="css-class-names"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

/**
 * Style editor with common properties
 */
function StyleEditor({
  styles,
  onChange,
}: {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}) {
  const styleGroups = [
    {
      name: 'Layout',
      properties: [
        { name: 'display', label: 'Display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] },
        { name: 'position', label: 'Position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
        { name: 'width', label: 'Width', type: 'text' },
        { name: 'height', label: 'Height', type: 'text' },
      ],
    },
    {
      name: 'Spacing',
      properties: [
        { name: 'padding', label: 'Padding', type: 'text' },
        { name: 'margin', label: 'Margin', type: 'text' },
        { name: 'gap', label: 'Gap', type: 'text' },
      ],
    },
    {
      name: 'Typography',
      properties: [
        { name: 'fontSize', label: 'Font Size', type: 'text' },
        { name: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
        { name: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
        { name: 'color', label: 'Color', type: 'color' },
      ],
    },
    {
      name: 'Appearance',
      properties: [
        { name: 'backgroundColor', label: 'Background', type: 'color' },
        { name: 'borderRadius', label: 'Border Radius', type: 'text' },
        { name: 'border', label: 'Border', type: 'text' },
        { name: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.1 },
      ],
    },
  ];

  return (
    <div className="p-3 space-y-4">
      {styleGroups.map((group) => (
        <div key={group.name}>
          <h4 className="text-xs font-medium text-muted-foreground mb-2">{group.name}</h4>
          <div className="space-y-2">
            {group.properties.map((prop) => (
              <StyleProperty
                key={prop.name}
                prop={prop}
                value={styles[prop.name]}
                onChange={(value) => onChange(prop.name, value)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Individual style property
 */
function StyleProperty({
  prop,
  value,
  onChange,
}: {
  prop: any;
  value: string;
  onChange: (value: string) => void;
}) {
  const { name, label, type, options, min, max, step } = prop;

  switch (type) {
    case 'select':
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'color':
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer"
            />
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="auto"
              className="h-7 w-[100px] text-xs"
            />
          </div>
        </div>
      );

    case 'range':
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <span className="text-xs text-muted-foreground">{value || '1'}</span>
          </div>
          <Slider
            value={[parseFloat(value) || 1]}
            min={min}
            max={max}
            step={step}
            onValueChange={([v]) => onChange(String(v))}
          />
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="auto"
            className="h-7 w-[120px] text-xs"
          />
        </div>
      );
  }
}
