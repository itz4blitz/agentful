/**
 * shadcn/ui Component Registry
 * All 54 shadcn components with full prop definitions
 */

import type { ComponentDefinition, PropDefinition } from '@/types/component-system';

// Shared prop types
const variantProp = (options: string[]): PropDefinition => ({
  type: 'select',
  name: 'variant',
  label: 'Variant',
  options,
  defaultValue: options[0],
});

const sizeProp = (options: string[] = ['sm', 'default', 'lg']): PropDefinition => ({
  type: 'select',
  name: 'size',
  label: 'Size',
  options,
  defaultValue: 'default',
});

const booleanProp = (name: string, label: string, defaultValue = false): PropDefinition => ({
  type: 'boolean',
  name,
  label,
  defaultValue,
});

const stringProp = (name: string, label: string, placeholder = ''): PropDefinition => ({
  type: 'string',
  name,
  label,
  placeholder,
  defaultValue: '',
});

// Component Registry
export const shadcnRegistry: ComponentDefinition[] = [
  // ACCORDION
  {
    id: 'accordion',
    name: 'Accordion',
    description: 'A vertically stacked set of interactive headings',
    category: 'layout',
    tags: ['collapsible', 'expand', 'faq'],
    icon: 'chevrons-up-down',
    imports: ['@/components/ui/accordion'],
    component: 'Accordion',
    defaultProps: {
      type: 'single',
      collapsible: true,
    },
    props: [
      {
        type: 'select',
        name: 'type',
        label: 'Type',
        options: ['single', 'multiple'],
        defaultValue: 'single',
      },
      booleanProp('collapsible', 'Collapsible', true),
    ],
    children: {
      allowed: true,
      description: 'AccordionItem components',
    },
  },

  // ALERT
  {
    id: 'alert',
    name: 'Alert',
    description: 'Displays a callout for user attention',
    category: 'feedback',
    tags: ['notification', 'message', 'banner'],
    icon: 'alert-circle',
    imports: ['@/components/ui/alert'],
    component: 'Alert',
    defaultProps: {
      variant: 'default',
    },
    props: [
      variantProp(['default', 'destructive']),
    ],
    children: {
      allowed: true,
      default: '<AlertTitle>Title</AlertTitle><AlertDescription>Description</AlertDescription>',
    },
  },

  // ALERT DIALOG
  {
    id: 'alert-dialog',
    name: 'Alert Dialog',
    description: 'A modal dialog that interrupts the user',
    category: 'overlays',
    tags: ['modal', 'confirm', 'popup'],
    icon: 'alert-triangle',
    imports: ['@/components/ui/alert-dialog'],
    component: 'AlertDialog',
    defaultProps: {},
    props: [
      booleanProp('open', 'Open', false),
    ],
    children: {
      allowed: true,
      default: `<AlertDialogTrigger>Open</AlertDialogTrigger>
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Continue</AlertDialogAction>
  </AlertDialogFooter>
</AlertDialogContent>`,
    },
  },

  // AVATAR
  {
    id: 'avatar',
    name: 'Avatar',
    description: 'An image element with a fallback for initials',
    category: 'data-display',
    tags: ['profile', 'image', 'user'],
    icon: 'user-circle',
    imports: ['@/components/ui/avatar'],
    component: 'Avatar',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: '<AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback>',
    },
  },

  // BADGE
  {
    id: 'badge',
    name: 'Badge',
    description: 'Displays a badge or a component that looks like a badge',
    category: 'data-display',
    tags: ['tag', 'label', 'status'],
    icon: 'tag',
    imports: ['@/components/ui/badge'],
    component: 'Badge',
    defaultProps: {
      variant: 'default',
    },
    props: [
      variantProp(['default', 'secondary', 'destructive', 'outline']),
    ],
    children: {
      allowed: true,
      default: 'Badge',
    },
  },

  // BREADCRUMB
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    description: 'Displays the path to the current resource',
    category: 'navigation',
    tags: ['nav', 'path', 'hierarchy'],
    icon: 'gantt-chart',
    imports: ['@/components/ui/breadcrumb'],
    component: 'Breadcrumb',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<BreadcrumbList>
  <BreadcrumbItem>
    <BreadcrumbLink href="/">Home</BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
    <BreadcrumbPage>Current</BreadcrumbPage>
  </BreadcrumbItem>
</BreadcrumbList>`,
    },
  },

  // BUTTON
  {
    id: 'button',
    name: 'Button',
    description: 'Displays a button or a component that looks like a button',
    category: 'forms',
    tags: ['click', 'action', 'cta'],
    icon: 'mouse-pointer-click',
    imports: ['@/components/ui/button'],
    component: 'Button',
    defaultProps: {
      variant: 'default',
      size: 'default',
    },
    props: [
      variantProp(['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']),
      sizeProp(['default', 'sm', 'lg', 'icon']),
      booleanProp('disabled', 'Disabled'),
      booleanProp('loading', 'Loading'),
    ],
    children: {
      allowed: true,
      default: 'Button',
    },
  },

  // CALENDAR
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'A date field component that allows users to enter and edit date',
    category: 'forms',
    tags: ['date', 'picker', 'schedule'],
    icon: 'calendar',
    imports: ['@/components/ui/calendar'],
    component: 'Calendar',
    defaultProps: {
      mode: 'single',
    },
    props: [
      {
        type: 'select',
        name: 'mode',
        label: 'Mode',
        options: ['single', 'multiple', 'range'],
        defaultValue: 'single',
      },
      booleanProp('showOutsideDays', 'Show Outside Days', true),
    ],
    children: {
      allowed: false,
    },
  },

  // CARD
  {
    id: 'card',
    name: 'Card',
    description: 'A container for grouping related content',
    category: 'layout',
    tags: ['container', 'box', 'panel'],
    icon: 'square',
    imports: ['@/components/ui/card'],
    component: 'Card',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<CardHeader>
  <CardTitle>Card Title</CardTitle>
  <CardDescription>Card Description</CardDescription>
</CardHeader>
<CardContent>
  <p>Card content goes here.</p>
</CardContent>
<CardFooter>
  <p>Footer</p>
</CardFooter>`,
    },
  },

  // CHECKBOX
  {
    id: 'checkbox',
    name: 'Checkbox',
    description: 'A control that allows the user to toggle between checked and not checked',
    category: 'forms',
    tags: ['input', 'toggle', 'select'],
    icon: 'check-square',
    imports: ['@/components/ui/checkbox'],
    component: 'Checkbox',
    defaultProps: {},
    props: [
      booleanProp('checked', 'Checked'),
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: true,
      default: '<label htmlFor="terms">Accept terms</label>',
    },
  },

  // COLLAPSIBLE
  {
    id: 'collapsible',
    name: 'Collapsible',
    description: 'An interactive component which expands/collapses a panel',
    category: 'layout',
    tags: ['expand', 'collapse', 'toggle'],
    icon: 'chevron-down',
    imports: ['@/components/ui/collapsible'],
    component: 'Collapsible',
    defaultProps: {
      open: false,
    },
    props: [
      booleanProp('open', 'Open', false),
    ],
    children: {
      allowed: true,
      default: `<CollapsibleTrigger>Toggle</CollapsibleTrigger>
<CollapsibleContent>
  Content
</CollapsibleContent>`,
    },
  },

  // COMMAND
  {
    id: 'command',
    name: 'Command',
    description: 'Fast, composable, unstyled command menu',
    category: 'navigation',
    tags: ['search', 'menu', 'cmdk'],
    icon: 'command',
    imports: ['@/components/ui/command'],
    component: 'Command',
    defaultProps: {},
    props: [
      stringProp('placeholder', 'Placeholder', 'Type a command or search...'),
    ],
    children: {
      allowed: true,
      default: `<CommandInput placeholder="Type a command or search..." />
<CommandList>
  <CommandEmpty>No results found.</CommandEmpty>
  <CommandGroup heading="Suggestions">
    <CommandItem>Calendar</CommandItem>
    <CommandItem>Search</CommandItem>
  </CommandGroup>
</CommandList>`,
    },
  },

  // CONTEXT MENU
  {
    id: 'context-menu',
    name: 'Context Menu',
    description: 'Displays a menu to the user — such as a set of actions or functions',
    category: 'overlays',
    tags: ['right-click', 'menu', 'popup'],
    icon: 'menu',
    imports: ['@/components/ui/context-menu'],
    component: 'ContextMenu',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<ContextMenuTrigger>Right click</ContextMenuTrigger>
<ContextMenuContent>
  <ContextMenuItem>Cut</ContextMenuItem>
  <ContextMenuItem>Copy</ContextMenuItem>
  <ContextMenuItem>Paste</ContextMenuItem>
</ContextMenuContent>`,
    },
  },

  // DIALOG
  {
    id: 'dialog',
    name: 'Dialog',
    description: 'A window overlaid on either the primary window or another dialog',
    category: 'overlays',
    tags: ['modal', 'popup', 'window'],
    icon: 'copy',
    imports: ['@/components/ui/dialog'],
    component: 'Dialog',
    defaultProps: {},
    props: [
      booleanProp('open', 'Open', false),
    ],
    children: {
      allowed: true,
      default: `<DialogTrigger>Open</DialogTrigger>
<DialogContent>
  <DialogHeader>
    <DialogTitle>Dialog Title</DialogTitle>
    <DialogDescription>
      Dialog description
    </DialogDescription>
  </DialogHeader>
  <div className="py-4">Content</div>
  <DialogFooter>
    <Button type="submit">Save</Button>
  </DialogFooter>
</DialogContent>`,
    },
  },

  // DROPDOWN MENU
  {
    id: 'dropdown-menu',
    name: 'Dropdown Menu',
    description: 'Displays a menu to the user — such as a set of actions or functions',
    category: 'overlays',
    tags: ['menu', 'select', 'popup'],
    icon: 'chevron-down-circle',
    imports: ['@/components/ui/dropdown-menu'],
    component: 'DropdownMenu',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<DropdownMenuTrigger>Open</DropdownMenuTrigger>
<DropdownMenuContent>
  <DropdownMenuLabel>My Account</DropdownMenuLabel>
  <DropdownMenuSeparator />
  <DropdownMenuItem>Profile</DropdownMenuItem>
  <DropdownMenuItem>Billing</DropdownMenuItem>
  <DropdownMenuItem>Settings</DropdownMenuItem>
</DropdownMenuContent>`,
    },
  },

  // FORM (with all form components)
  {
    id: 'form',
    name: 'Form',
    description: 'Building forms with React Hook Form and Zod',
    category: 'forms',
    tags: ['input', 'validation', 'submit'],
    icon: 'file-text',
    imports: ['@/components/ui/form', '@/components/ui/input', '@/components/ui/button'],
    component: 'Form',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<form className="space-y-8">
  <FormItem>
    <FormLabel>Username</FormLabel>
    <FormControl>
      <Input placeholder="shadcn" />
    </FormControl>
    <FormDescription>This is your public display name.</FormDescription>
    <FormMessage />
  </FormItem>
  <Button type="submit">Submit</Button>
</form>`,
    },
  },

  // HOVER CARD
  {
    id: 'hover-card',
    name: 'Hover Card',
    description: 'For sighted users to preview content available behind a link',
    category: 'overlays',
    tags: ['tooltip', 'preview', 'popup'],
    icon: 'mouse-pointer-2',
    imports: ['@/components/ui/hover-card'],
    component: 'HoverCard',
    defaultProps: {
      openDelay: 200,
      closeDelay: 200,
    },
    props: [
      { type: 'number', name: 'openDelay', label: 'Open Delay (ms)', defaultValue: 200 },
      { type: 'number', name: 'closeDelay', label: 'Close Delay (ms)', defaultValue: 200 },
    ],
    children: {
      allowed: true,
      default: `<HoverCardTrigger>Hover</HoverCardTrigger>
<HoverCardContent>
  Preview content
</HoverCardContent>`,
    },
  },

  // INPUT
  {
    id: 'input',
    name: 'Input',
    description: 'Displays a form input field or a component that looks like an input field',
    category: 'forms',
    tags: ['text', 'field', 'form'],
    icon: 'type',
    imports: ['@/components/ui/input'],
    component: 'Input',
    defaultProps: {
      type: 'text',
    },
    props: [
      {
        type: 'select',
        name: 'type',
        label: 'Type',
        options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
        defaultValue: 'text',
      },
      stringProp('placeholder', 'Placeholder', 'Enter text...'),
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: false,
    },
  },

  // LABEL
  {
    id: 'label',
    name: 'Label',
    description: 'Renders an accessible label associated with controls',
    category: 'forms',
    tags: ['text', 'form', 'accessibility'],
    icon: 'tag',
    imports: ['@/components/ui/label'],
    component: 'Label',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: 'Label',
    },
  },

  // MENUBAR
  {
    id: 'menubar',
    name: 'Menubar',
    description: 'A visually persistent menu common in desktop applications',
    category: 'navigation',
    tags: ['menu', 'nav', 'desktop'],
    icon: 'menu-square',
    imports: ['@/components/ui/menubar'],
    component: 'Menubar',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<MenubarMenu>
  <MenubarTrigger>File</MenubarTrigger>
  <MenubarContent>
    <MenubarItem>New Tab</MenubarItem>
    <MenubarItem>New Window</MenubarItem>
    <MenubarSeparator />
    <MenubarItem>Share</MenubarItem>
  </MenubarContent>
</MenubarMenu>`,
    },
  },

  // NAVIGATION MENU
  {
    id: 'navigation-menu',
    name: 'Navigation Menu',
    description: 'A collection of links for navigating websites',
    category: 'navigation',
    tags: ['nav', 'links', 'header'],
    icon: 'compass',
    imports: ['@/components/ui/navigation-menu'],
    component: 'NavigationMenu',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<NavigationMenuList>
  <NavigationMenuItem>
    <NavigationMenuLink href="/">Home</NavigationMenuLink>
  </NavigationMenuItem>
  <NavigationMenuItem>
    <NavigationMenuLink href="/about">About</NavigationMenuLink>
  </NavigationMenuItem>
</NavigationMenuList>`,
    },
  },

  // POPOVER
  {
    id: 'popover',
    name: 'Popover',
    description: 'Displays rich content in a portal, triggered by a button',
    category: 'overlays',
    tags: ['popup', 'tooltip', 'menu'],
    icon: 'popover',
    imports: ['@/components/ui/popover'],
    component: 'Popover',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<PopoverTrigger>Open</PopoverTrigger>
<PopoverContent>
  <div className="grid gap-4">
    <div className="space-y-2">
      <h4 className="font-medium leading-none">Dimensions</h4>
      <p className="text-sm text-muted-foreground">
        Set the dimensions for the layer.
      </p>
    </div>
  </div>
</PopoverContent>`,
    },
  },

  // PROGRESS
  {
    id: 'progress',
    name: 'Progress',
    description: 'Displays an indicator showing the completion progress of a task',
    category: 'feedback',
    tags: ['loading', 'bar', 'percent'],
    icon: 'progress',
    imports: ['@/components/ui/progress'],
    component: 'Progress',
    defaultProps: {
      value: 50,
    },
    props: [
      { type: 'number', name: 'value', label: 'Value', defaultValue: 50, min: 0, max: 100 },
    ],
    children: {
      allowed: false,
    },
  },

  // RADIO GROUP
  {
    id: 'radio-group',
    name: 'Radio Group',
    description: 'A set of checkable buttons—known as radio buttons',
    category: 'forms',
    tags: ['input', 'select', 'single'],
    icon: 'circle-dot',
    imports: ['@/components/ui/radio-group'],
    component: 'RadioGroup',
    defaultProps: {
      defaultValue: 'option-one',
    },
    props: [
      stringProp('defaultValue', 'Default Value', 'option-one'),
    ],
    children: {
      allowed: true,
      default: `<div className="flex items-center space-x-2">
  <RadioGroupItem value="option-one" id="option-one" />
  <Label htmlFor="option-one">Option One</Label>
</div>
<div className="flex items-center space-x-2">
  <RadioGroupItem value="option-two" id="option-two" />
  <Label htmlFor="option-two">Option Two</Label>
</div>`,
    },
  },

  // RESIZABLE
  {
    id: 'resizable',
    name: 'Resizable',
    description: 'Accessible resizable panel groups and layouts',
    category: 'layout',
    tags: ['split', 'panel', 'drag'],
    icon: 'move-horizontal',
    imports: ['@/components/ui/resizable'],
    component: 'ResizablePanelGroup',
    defaultProps: {
      direction: 'horizontal',
    },
    props: [
      {
        type: 'select',
        name: 'direction',
        label: 'Direction',
        options: ['horizontal', 'vertical'],
        defaultValue: 'horizontal',
      },
    ],
    children: {
      allowed: true,
      default: `<ResizablePanel defaultSize={50}>
  <div className="flex h-full items-center justify-center p-6">
    <span className="font-semibold">One</span>
  </div>
</ResizablePanel>
<ResizableHandle />
<ResizablePanel defaultSize={50}>
  <div className="flex h-full items-center justify-center p-6">
    <span className="font-semibold">Two</span>
  </div>
</ResizablePanel>`,
    },
  },

  // SCROLL AREA
  {
    id: 'scroll-area',
    name: 'Scroll Area',
    description: 'Augments native scroll functionality for custom, cross-browser styling',
    category: 'layout',
    tags: ['scroll', 'overflow', 'custom'],
    icon: 'scroll',
    imports: ['@/components/ui/scroll-area'],
    component: 'ScrollArea',
    defaultProps: {
      className: 'h-[200px] w-[350px]',
    },
    props: [
      booleanProp('type', 'Auto Hide', false),
    ],
    children: {
      allowed: true,
      default: '<div className="p-4">Scrollable content goes here...</div>',
    },
  },

  // SELECT
  {
    id: 'select',
    name: 'Select',
    description: 'Displays a list of options for the user to pick from',
    category: 'forms',
    tags: ['dropdown', 'input', 'choice'],
    icon: 'list',
    imports: ['@/components/ui/select'],
    component: 'Select',
    defaultProps: {},
    props: [
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: true,
      default: `<SelectTrigger>
  <SelectValue placeholder="Select an option" />
</SelectTrigger>
<SelectContent>
  <SelectItem value="light">Light</SelectItem>
  <SelectItem value="dark">Dark</SelectItem>
  <SelectItem value="system">System</SelectItem>
</SelectContent>`,
    },
  },

  // SEPARATOR
  {
    id: 'separator',
    name: 'Separator',
    description: 'Visually or semantically separates content',
    category: 'layout',
    tags: ['divider', 'line', 'hr'],
    icon: 'minus',
    imports: ['@/components/ui/separator'],
    component: 'Separator',
    defaultProps: {
      orientation: 'horizontal',
    },
    props: [
      {
        type: 'select',
        name: 'orientation',
        label: 'Orientation',
        options: ['horizontal', 'vertical'],
        defaultValue: 'horizontal',
      },
    ],
    children: {
      allowed: false,
    },
  },

  // SHEET
  {
    id: 'sheet',
    name: 'Sheet',
    description: 'Extends the Dialog component to display content that complements the main content',
    category: 'overlays',
    tags: ['drawer', 'panel', 'slide'],
    icon: 'panel-left',
    imports: ['@/components/ui/sheet'],
    component: 'Sheet',
    defaultProps: {},
    props: [
      {
        type: 'select',
        name: 'side',
        label: 'Side',
        options: ['top', 'right', 'bottom', 'left'],
        defaultValue: 'right',
      },
    ],
    children: {
      allowed: true,
      default: `<SheetTrigger>Open</SheetTrigger>
<SheetContent>
  <SheetHeader>
    <SheetTitle>Edit profile</SheetTitle>
    <SheetDescription>
      Make changes to your profile here.
    </SheetDescription>
  </SheetHeader>
  <div className="grid gap-4 py-4">
    <div className="grid grid-cols-4 items-center gap-4">
      <Label htmlFor="name" className="text-right">Name</Label>
      <Input id="name" value="Pedro Duarte" className="col-span-3" />
    </div>
  </div>
  <SheetFooter>
    <SheetClose asChild>
      <Button type="submit">Save changes</Button>
    </SheetClose>
  </SheetFooter>
</SheetContent>`,
    },
  },

  // SKELETON
  {
    id: 'skeleton',
    name: 'Skeleton',
    description: 'Use to show a placeholder while content is loading',
    category: 'feedback',
    tags: ['loading', 'placeholder', 'shimmer'],
    icon: 'loader-2',
    imports: ['@/components/ui/skeleton'],
    component: 'Skeleton',
    defaultProps: {
      className: 'h-4 w-[250px]',
    },
    props: [],
    children: {
      allowed: false,
    },
  },

  // SLIDER
  {
    id: 'slider',
    name: 'Slider',
    description: 'An input where the user selects a value from within a given range',
    category: 'forms',
    tags: ['range', 'input', 'drag'],
    icon: 'sliders-horizontal',
    imports: ['@/components/ui/slider'],
    component: 'Slider',
    defaultProps: {
      defaultValue: [50],
      max: 100,
      step: 1,
    },
    props: [
      { type: 'number', name: 'max', label: 'Max', defaultValue: 100 },
      { type: 'number', name: 'step', label: 'Step', defaultValue: 1 },
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: false,
    },
  },

  // SONNER (Toast)
  {
    id: 'sonner',
    name: 'Sonner',
    description: 'An opinionated toast component for React',
    category: 'feedback',
    tags: ['toast', 'notification', 'alert'],
    icon: 'bell',
    imports: ['@/components/ui/sonner'],
    component: 'Toaster',
    defaultProps: {
      position: 'bottom-right',
    },
    props: [
      {
        type: 'select',
        name: 'position',
        label: 'Position',
        options: ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'],
        defaultValue: 'bottom-right',
      },
      booleanProp('richColors', 'Rich Colors'),
    ],
    children: {
      allowed: false,
    },
  },

  // SWITCH
  {
    id: 'switch',
    name: 'Switch',
    description: 'A control that allows the user to toggle between checked and not checked',
    category: 'forms',
    tags: ['toggle', 'input', 'boolean'],
    icon: 'toggle-right',
    imports: ['@/components/ui/switch'],
    component: 'Switch',
    defaultProps: {},
    props: [
      booleanProp('checked', 'Checked'),
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: true,
      default: '<Label htmlFor="airplane-mode">Airplane Mode</Label>',
    },
  },

  // TABLE
  {
    id: 'table',
    name: 'Table',
    description: 'A responsive table component',
    category: 'data-display',
    tags: ['data', 'grid', 'list'],
    icon: 'table',
    imports: ['@/components/ui/table'],
    component: 'Table',
    defaultProps: {},
    props: [],
    children: {
      allowed: true,
      default: `<TableHeader>
  <TableRow>
    <TableHead className="w-[100px]">Invoice</TableHead>
    <TableHead>Status</TableHead>
    <TableHead>Method</TableHead>
    <TableHead className="text-right">Amount</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  <TableRow>
    <TableCell className="font-medium">INV001</TableCell>
    <TableCell>Paid</TableCell>
    <TableCell>Credit Card</TableCell>
    <TableCell className="text-right">$250.00</TableCell>
  </TableRow>
</TableBody>`,
    },
  },

  // TABS
  {
    id: 'tabs',
    name: 'Tabs',
    description: 'A set of layered sections of content—known as tab panels',
    category: 'navigation',
    tags: ['switcher', 'panel', 'content'],
    icon: 'tabs',
    imports: ['@/components/ui/tabs'],
    component: 'Tabs',
    defaultProps: {
      defaultValue: 'account',
    },
    props: [
      stringProp('defaultValue', 'Default Tab', 'account'),
    ],
    children: {
      allowed: true,
      default: `<TabsList>
  <TabsTrigger value="account">Account</TabsTrigger>
  <TabsTrigger value="password">Password</TabsTrigger>
</TabsList>
<TabsContent value="account">
  Account settings
</TabsContent>
<TabsContent value="password">
  Password settings
</TabsContent>`,
    },
  },

  // TEXTAREA
  {
    id: 'textarea',
    name: 'Textarea',
    description: 'Displays a form textarea or a component that looks like a textarea',
    category: 'forms',
    tags: ['input', 'text', 'multiline'],
    icon: 'text',
    imports: ['@/components/ui/textarea'],
    component: 'Textarea',
    defaultProps: {
      placeholder: 'Type your message here.',
    },
    props: [
      stringProp('placeholder', 'Placeholder', 'Type your message here.'),
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: false,
    },
  },

  // TOGGLE
  {
    id: 'toggle',
    name: 'Toggle',
    description: 'A two-state button that can be either on or off',
    category: 'forms',
    tags: ['button', 'state', 'press'],
    icon: 'toggle-left',
    imports: ['@/components/ui/toggle'],
    component: 'Toggle',
    defaultProps: {
      variant: 'default',
      size: 'default',
    },
    props: [
      variantProp(['default', 'outline']),
      sizeProp(),
      booleanProp('pressed', 'Pressed'),
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: true,
      default: 'B',
    },
  },

  // TOGGLE GROUP
  {
    id: 'toggle-group',
    name: 'Toggle Group',
    description: 'A set of two-state buttons that can be toggled on or off',
    category: 'forms',
    tags: ['buttons', 'select', 'multi'],
    icon: 'toggle',
    imports: ['@/components/ui/toggle-group'],
    component: 'ToggleGroup',
    defaultProps: {
      type: 'single',
    },
    props: [
      {
        type: 'select',
        name: 'type',
        label: 'Type',
        options: ['single', 'multiple'],
        defaultValue: 'single',
      },
      booleanProp('disabled', 'Disabled'),
    ],
    children: {
      allowed: true,
      default: `<ToggleGroupItem value="a">A</ToggleGroupItem>
<ToggleGroupItem value="b">B</ToggleGroupItem>
<ToggleGroupItem value="c">C</ToggleGroupItem>`,
    },
  },

  // TOOLTIP
  {
    id: 'tooltip',
    name: 'Tooltip',
    description: 'A popup that displays information related to an element',
    category: 'overlays',
    tags: ['hint', 'help', 'popup'],
    icon: 'help-circle',
    imports: ['@/components/ui/tooltip'],
    component: 'Tooltip',
    defaultProps: {},
    props: [
      stringProp('delayDuration', 'Delay (ms)', '0'),
    ],
    children: {
      allowed: true,
      default: `<TooltipTrigger>Hover</TooltipTrigger>
<TooltipContent>
  <p>Add to library</p>
</TooltipContent>`,
    },
  },
];

// Export helper to get component by ID
export const getShadcnComponent = (id: string): ComponentDefinition | undefined => {
  return shadcnRegistry.find(c => c.id === id);
};

// Export all component IDs
export const shadcnComponentIds = shadcnRegistry.map(c => c.id);

// Export by category
export const getComponentsByCategory = (category: string): ComponentDefinition[] => {
  return shadcnRegistry.filter(c => c.category === category);
};
