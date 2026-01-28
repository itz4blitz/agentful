/**
 * Dialog component examples for the showcase
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, Trash2, User } from 'lucide-react'
import type { ComponentMeta } from '../types'

export const dialogData: ComponentMeta = {
  name: 'Dialog',
  slug: 'dialog',
  category: 'overlays',
  description: 'A modal dialog that interrupts the user with important content and expects a response.',
  documentation: 'https://ui.shadcn.com/docs/components/dialog',
  props: [
    {
      name: 'open',
      type: 'boolean',
      required: false,
      default: 'undefined',
      description: 'Controlled open state of the dialog'
    },
    {
      name: 'defaultOpen',
      type: 'boolean',
      required: false,
      default: 'false',
      description: 'Default open state when uncontrolled'
    },
    {
      name: 'onOpenChange',
      type: '(open: boolean) => void',
      required: false,
      default: 'undefined',
      description: 'Callback when dialog open state changes'
    }
  ],
  examples: [
    {
      id: 'basic',
      title: 'Basic Dialog',
      description: 'Simple dialog with trigger and content',
      code: `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function BasicDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`,
      preview: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
    },
    {
      id: 'with-form',
      title: 'Dialog with Form',
      description: 'Dialog containing a form for user input',
      code: `import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DialogWithForm() {
  const [name, setName] = useState('')

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
      preview: () => {
        const [name, setName] = useState('')
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    },
    {
      id: 'controlled',
      title: 'Controlled Dialog',
      description: 'Dialog with controlled state',
      code: `import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ControlledDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Controlled Dialog</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled Dialog</DialogTitle>
            <DialogDescription>
              This dialog is controlled by parent state.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}`,
      preview: () => {
        const [open, setOpen] = useState(false)
        return (
          <>
            <Button onClick={() => setOpen(true)}>Open Controlled Dialog</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                  <DialogDescription>
                    This dialog is controlled by parent state. You can close it by clicking outside or using the buttons below.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setOpen(false)}>
                    Confirm
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )
      }
    },
    {
      id: 'scrollable',
      title: 'Scrollable Content',
      description: 'Dialog with scrollable content area',
      code: `import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export function ScrollableDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">View Terms</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>
            Please read these terms carefully
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <p>Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          {/* More content */}
        </div>
      </DialogContent>
    </Dialog>
  )
}`,
      preview: () => (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">View Terms</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Terms of Service</DialogTitle>
              <DialogDescription>
                Please read these terms carefully
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] space-y-4 text-sm">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
              <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.</p>
              <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.</p>
              <p>Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.</p>
              <p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum.</p>
            </div>
          </DialogContent>
        </Dialog>
      )
    }
  ],
  relatedComponents: ['alert-dialog', 'drawer', 'sheet', 'popover']
}
