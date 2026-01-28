import type { ComponentTemplate } from './component-registry'

/**
 * ShadCN UI component registry
 * Pre-configured ShadCN components for the visual website builder
 */
export const SHADCN_COMPONENTS: ComponentTemplate[] = [
  {
    id: 'shadcn-button',
    name: 'Button',
    category: 'forms',
    description: 'ShadCN Button component with multiple variants (default, destructive, outline, secondary, ghost, link)',
    tags: ['shadcn', 'button', 'form', 'interactive'],
    icon: 'mouse-pointer',
    html: `<Button variant="default">Click me</Button>`,
  },
  {
    id: 'shadcn-input',
    name: 'Input',
    category: 'forms',
    description: 'ShadCN Input component for text entry with built-in styling',
    tags: ['shadcn', 'input', 'form', 'text'],
    icon: 'type',
    html: `<Input type="text" placeholder="Enter text..." />`,
  },
  {
    id: 'shadcn-card',
    name: 'Card',
    category: 'layout',
    description: 'ShadCN Card component with header, content, and footer sections',
    tags: ['shadcn', 'card', 'layout', 'container'],
    icon: 'square',
    html: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`,
  },
  {
    id: 'shadcn-alert',
    name: 'Alert',
    category: 'feedback',
    description: 'ShadCN Alert component for displaying important messages with variants (default, destructive)',
    tags: ['shadcn', 'alert', 'feedback', 'notification'],
    icon: 'alert-circle',
    html: `<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    This is an important alert message.
  </AlertDescription>
</Alert>`,
  },
  {
    id: 'shadcn-dialog',
    name: 'Dialog',
    category: 'overlay',
    description: 'ShadCN Dialog component for modal overlays with triggers',
    tags: ['shadcn', 'dialog', 'modal', 'overlay'],
    icon: 'maximize',
    html: `<Dialog>
  <DialogTrigger>Open Dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        Dialog description goes here
      </DialogDescription>
    </DialogHeader>
    <div>Dialog content</div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
  },
  {
    id: 'shadcn-dropdown-menu',
    name: 'DropdownMenu',
    category: 'navigation',
    description: 'ShadCN DropdownMenu component for context menus and dropdown actions',
    tags: ['shadcn', 'dropdown', 'menu', 'navigation'],
    icon: 'chevron-down',
    html: `<DropdownMenu>
  <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
  },
  {
    id: 'shadcn-select',
    name: 'Select',
    category: 'forms',
    description: 'ShadCN Select component for choosing from a list of options',
    tags: ['shadcn', 'select', 'form', 'dropdown'],
    icon: 'check-square',
    html: `<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>`,
  },
  {
    id: 'shadcn-tabs',
    name: 'Tabs',
    category: 'navigation',
    description: 'ShadCN Tabs component for organizing content into tabbed sections',
    tags: ['shadcn', 'tabs', 'navigation', 'layout'],
    icon: 'columns',
    html: `<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Content for Tab 1
  </TabsContent>
  <TabsContent value="tab2">
    Content for Tab 2
  </TabsContent>
  <TabsContent value="tab3">
    Content for Tab 3
  </TabsContent>
</Tabs>`,
  },
  {
    id: 'shadcn-table',
    name: 'Table',
    category: 'data',
    description: 'ShadCN Table component for displaying tabular data with header and body',
    tags: ['shadcn', 'table', 'data', 'layout'],
    icon: 'table',
    html: `<Table>
  <TableCaption>A list of your recent invoices</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell>$250.00</TableCell>
    </TableRow>
    <TableRow>
      <TableCell>INV002</TableCell>
      <TableCell>Pending</TableCell>
      <TableCell>$150.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`,
  },
  {
    id: 'shadcn-badge',
    name: 'Badge',
    category: 'feedback',
    description: 'ShadCN Badge component for labels and status indicators with variants',
    tags: ['shadcn', 'badge', 'label', 'status'],
    icon: 'tag',
    html: `<Badge variant="default">Badge</Badge>`,
  },
  {
    id: 'shadcn-switch',
    name: 'Switch',
    category: 'forms',
    description: 'ShadCN Switch component for toggle-style binary choices',
    tags: ['shadcn', 'switch', 'toggle', 'form'],
    icon: 'toggle-left',
    html: `<Switch />`,
  },
  {
    id: 'shadcn-checkbox',
    name: 'Checkbox',
    category: 'forms',
    description: 'ShadCN Checkbox component for multiple selection options',
    tags: ['shadcn', 'checkbox', 'form', 'selection'],
    icon: 'check-square',
    html: `<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <label htmlFor="terms">Accept terms and conditions</label>
</div>`,
  },
  {
    id: 'shadcn-textarea',
    name: 'Textarea',
    category: 'forms',
    description: 'ShadCN Textarea component for multi-line text input',
    tags: ['shadcn', 'textarea', 'form', 'text'],
    icon: 'align-left',
    html: `<Textarea placeholder="Enter your message here..." />`,
  },
  {
    id: 'shadcn-slider',
    name: 'Slider',
    category: 'forms',
    description: 'ShadCN Slider component for selecting values from a range',
    tags: ['shadcn', 'slider', 'form', 'range'],
    icon: 'sliders',
    html: `<Slider defaultValue={[50]} max={100} step={1} />`,
  },
  {
    id: 'shadcn-progress',
    name: 'Progress',
    category: 'feedback',
    description: 'ShadCN Progress component for displaying completion percentage',
    tags: ['shadcn', 'progress', 'feedback', 'loading'],
    icon: 'activity',
    html: `<Progress value={66} />`,
  },
  {
    id: 'shadcn-spinner',
    name: 'Spinner',
    category: 'feedback',
    description: 'ShadCN Spinner component for loading states',
    tags: ['shadcn', 'spinner', 'loading', 'feedback'],
    icon: 'loader',
    html: `<Spinner className="h-8 w-8" />`,
  },
  {
    id: 'shadcn-skeleton',
    name: 'Skeleton',
    category: 'feedback',
    description: 'ShadCN Skeleton component for content loading placeholders',
    tags: ['shadcn', 'skeleton', 'loading', 'placeholder'],
    icon: 'box',
    html: `<Skeleton className="h-12 w-full" />`,
  },
  {
    id: 'shadcn-tooltip',
    name: 'Tooltip',
    category: 'overlays',
    description: 'ShadCN Tooltip component for displaying additional information on hover',
    tags: ['shadcn', 'tooltip', 'overlay', 'help'],
    icon: 'help-circle',
    html: `<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>
    <p>Additional information goes here</p>
  </TooltipContent>
</Tooltip>`,
  },
  {
    id: 'shadcn-popover',
    name: 'Popover',
    category: 'overlays',
    description: 'ShadCN Popover component for floating content with triggers',
    tags: ['shadcn', 'popover', 'overlay', 'floating'],
    icon: 'popcorn',
    html: `<Popover>
  <PopoverTrigger>Open Popover</PopoverTrigger>
  <PopoverContent>
    <div className="space-y-2">
      <h4 className="font-medium">Popover Content</h4>
      <p className="text-sm text-muted-foreground">
        Additional content displayed in a floating container
      </p>
    </div>
  </PopoverContent>
</Popover>`,
  },
  {
    id: 'shadcn-accordion',
    name: 'Accordion',
    category: 'navigation',
    description: 'ShadCN Accordion component for collapsible content sections',
    tags: ['shadcn', 'accordion', 'collapse', 'navigation'],
    icon: 'chevrons-down',
    html: `<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Is it accessible?</AccordionTrigger>
    <AccordionContent>
      Yes. It adheres to the WAI-ARIA design pattern.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it styled?</AccordionTrigger>
    <AccordionContent>
      Yes. It comes with default styles that you can customize.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
  },
]
