/**
 * ExportDialog Component
 * Export options dialog with format selection and settings
 */

import * as React from 'react';
import {
  FileCode,
  Download,
  Settings2,
  File,
  Package,
  FileJson,
  Check,
} from 'lucide-react';
import { useProjectStore } from '@/stores/project-store';
import type { ExportOptions, ExportFormat } from '@/types/project';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}

export const ExportDialog = React.memo(
  ({ open, onOpenChange, className }: ExportDialogProps) => {
    const { currentProject, exportProject } = useProjectStore();

    const [format, setFormat] = React.useState<ExportFormat>('html');
    const [minify, setMinify] = React.useState(false);
    const [inlineCSS, setInlineCSS] = React.useState(false);
    const [includeAssets, setIncludeAssets] = React.useState(true);
    const [includeComments, setIncludeComments] = React.useState(false);
    const [sourceMap, setSourceMap] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [exportProgress, setExportProgress] = React.useState(0);

    // Reset state when dialog closes
    React.useEffect(() => {
      if (!open) {
        setFormat('html');
        setMinify(false);
        setInlineCSS(false);
        setIncludeAssets(true);
        setIncludeComments(false);
        setSourceMap(false);
        setExportProgress(0);
      }
    }, [open]);

    // Get format icon
    const getFormatIcon = (format: ExportFormat) => {
      switch (format) {
        case 'html':
          return FileCode;
        case 'react':
          return FileJson;
        case 'zip':
          return Package;
        default:
          return File;
      }
    };

    // Get format description
    const getFormatDescription = (format: ExportFormat) => {
      switch (format) {
        case 'html':
          return 'Standalone HTML file ready to deploy';
        case 'react':
          return 'React component with separate styles';
        case 'zip':
          return 'Complete bundle with all assets';
        default:
          return '';
      }
    };

    // Handle export
    const handleExport = async () => {
      if (!currentProject) return;

      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const options: ExportOptions = {
          format,
          minify,
          inlineCSS,
          includeAssets,
          includeComments,
          sourceMap,
        };

        await exportProject(options);

        setExportProgress(100);

        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        clearInterval(progressInterval);
        setIsExporting(false);
      }
    };

    // Check if any option is changed from defaults
    const hasCustomOptions =
      minify || inlineCSS || !includeAssets || includeComments || sourceMap;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Project</DialogTitle>
            <DialogDescription>
              Export &quot;{currentProject?.name}&quot; to your chosen format with custom
              options.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>Export Format</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['html', 'react', 'zip'] as ExportFormat[]).map((formatOption) => {
                  const Icon = getFormatIcon(formatOption);
                  const isSelected = format === formatOption;

                  return (
                    <TooltipProvider key={formatOption}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => setFormat(formatOption)}
                            disabled={isExporting}
                            className={cn(
                              'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                              'hover:bg-muted/50',
                              'disabled:opacity-50 disabled:cursor-not-allowed',
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            )}
                          >
                            <Icon className="h-6 w-6" />
                            <span className="font-medium text-sm">
                              {formatOption.toUpperCase()}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary absolute top-2 right-2" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          {getFormatDescription(formatOption)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {getFormatDescription(format)}
              </p>
            </div>

            <Separator />

            {/* Export Options */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                <Label>Export Options</Label>
                {hasCustomOptions && (
                  <span className="text-xs text-muted-foreground">
                    (Custom settings applied)
                  </span>
                )}
              </div>

              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-4">
                  {/* Minify */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="minify" className="cursor-pointer">
                        Minify code
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Remove whitespace and comments for smaller file size
                      </p>
                    </div>
                    <Switch
                      id="minify"
                      checked={minify}
                      onCheckedChange={setMinify}
                      disabled={isExporting}
                    />
                  </div>

                  {/* Inline CSS */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inline-css" className="cursor-pointer">
                        Inline CSS
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Embed CSS directly in HTML elements
                      </p>
                    </div>
                    <Switch
                      id="inline-css"
                      checked={inlineCSS}
                      onCheckedChange={setInlineCSS}
                      disabled={isExporting || format === 'zip'}
                    />
                  </div>

                  {/* Include Assets */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-assets" className="cursor-pointer">
                        Include assets
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Bundle images and fonts in export (ZIP only)
                      </p>
                    </div>
                    <Switch
                      id="include-assets"
                      checked={includeAssets}
                      onCheckedChange={setIncludeAssets}
                      disabled={isExporting || format !== 'zip'}
                    />
                  </div>

                  {/* Include Comments */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-comments" className="cursor-pointer">
                        Include comments
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add helpful comments in exported code
                      </p>
                    </div>
                    <Switch
                      id="include-comments"
                      checked={includeComments}
                      onCheckedChange={setIncludeComments}
                      disabled={isExporting}
                    />
                  </div>

                  {/* Source Map */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="source-map" className="cursor-pointer">
                        Source map
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Generate source map for debugging
                      </p>
                    </div>
                    <Switch
                      id="source-map"
                      checked={sourceMap}
                      onCheckedChange={setSourceMap}
                      disabled={isExporting || format === 'html'}
                    />
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Exporting...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting || !currentProject}>
              {isExporting ? (
                <>Exporting...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ExportDialog.displayName = 'ExportDialog';
