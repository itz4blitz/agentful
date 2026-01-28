/**
 * Button component examples for the showcase
 */

import { Button } from '@/components/ui/button'
import { Loader2, Mail, Plus, Trash2, Download, ChevronRight } from 'lucide-react'
import type { ComponentMeta } from '../types'

export const buttonData: ComponentMeta = {
  name: 'Button',
  slug: 'button',
  category: 'layout',
  description: 'Displays a button or a component that looks like a button. Supports multiple variants, sizes, and states.',
  documentation: 'https://ui.shadcn.com/docs/components/button',
  props: [
    {
      name: 'variant',
      type: '"default" | "secondary" | "destructive" | "outline" | "ghost" | "link"',
      required: false,
      default: 'default',
      description: 'Visual style variant of the button'
    },
    {
      name: 'size',
      type: '"default" | "sm" | "lg" | "icon"',
      required: false,
      default: 'default',
      description: 'Size of the button'
    },
    {
      name: 'asChild',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Whether to merge props with the child element'
    },
    {
      name: 'disabled',
      type: 'boolean',
      required: false,
      default: 'undefined',
      description: 'Disables the button interaction'
    }
  ],
  examples: [
    {
      id: 'default',
      title: 'Default Button',
      description: 'The default button variant for primary actions',
      code: `<Button>Click me</Button>`,
      preview: () => <Button>Click me</Button>
    },
    {
      id: 'variants',
      title: 'Button Variants',
      description: 'All available button style variants',
      code: `import { Button } from '@/components/ui/button'

export function ButtonVariants() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}`,
      preview: () => (
        <div className="flex flex-wrap gap-2">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      )
    },
    {
      id: 'sizes',
      title: 'Button Sizes',
      description: 'Different button sizes for different contexts',
      code: `import { Button } from '@/components/ui/button'

export function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}`,
      preview: () => (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      id: 'with-icon',
      title: 'Button with Icon',
      description: 'Button with an icon for visual clarity',
      code: `import { Button } from '@/components/ui/button'
import { Mail } from 'lucide-react'

export function ButtonWithIcon() {
  return (
    <Button>
      <Mail className="mr-2 h-4 w-4" />
      Login with Email
    </Button>
  )
}`,
      preview: () => (
        <Button>
          <Mail className="mr-2 h-4 w-4" />
          Login with Email
        </Button>
      )
    },
    {
      id: 'loading',
      title: 'Loading State',
      description: 'Button in loading state with spinner',
      code: `import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function ButtonLoading() {
  return (
    <Button disabled>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Please wait
    </Button>
  )
}`,
      preview: () => (
        <Button disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait
        </Button>
      )
    },
    {
      id: 'icon-button',
      title: 'Icon Button',
      description: 'Button that displays only an icon',
      code: `import { Button } from '@/components/ui/button'
import { Trash2, Download } from 'lucide-react'

export function IconButton() {
  return (
    <div className="flex gap-2">
      <Button size="icon" variant="outline">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button size="icon" variant="default">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}`,
      preview: () => (
        <div className="flex gap-2">
          <Button size="icon" variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="default">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    {
      id: 'as-child',
      title: 'As Child (Link)',
      description: 'Button rendered as a different element (like a link)',
      code: `import { Button } from '@/components/ui/button'

export function ButtonAsLink() {
  return (
    <Button asChild>
      <a href="https://example.com">
        Visit Documentation
        <ChevronRight className="ml-2 h-4 w-4" />
      </a>
    </Button>
  )
}`,
      preview: () => (
        <Button asChild>
          <a href="https://example.com" target="_blank" rel="noopener noreferrer">
            Visit Documentation
            <ChevronRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      )
    },
    {
      id: 'disabled',
      title: 'Disabled State',
      description: 'Button in disabled state',
      code: `import { Button } from '@/components/ui/button'

export function ButtonDisabled() {
  return (
    <div className="flex gap-2">
      <Button disabled variant="default">
        Can't click me
      </Button>
      <Button disabled variant="secondary">
        Also disabled
      </Button>
      <Button disabled variant="outline">
        Disabled outline
      </Button>
    </div>
  )
}`,
      preview: () => (
        <div className="flex gap-2">
          <Button disabled variant="default">
            Can't click me
          </Button>
          <Button disabled variant="secondary">
            Also disabled
          </Button>
          <Button disabled variant="outline">
            Disabled outline
          </Button>
        </div>
      )
    }
  ],
  relatedComponents: ['button-group', 'toggle', 'switch', 'dropdown-menu']
}
