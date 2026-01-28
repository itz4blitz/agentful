/**
 * Responsive Design Test Page
 *
 * This page demonstrates the mobile-first responsive updates to all UI components.
 * View this page at different viewport sizes to see the responsive behavior:
 *
 * - Mobile: 320px - 480px (base styles, larger touch targets)
 * - Tablet: 640px - 768px (sm: breakpoint enhancements)
 * - Desktop: 1024px+ (optimized spacing)
 */

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MoreHorizontal, Settings, User } from "lucide-react"

export function ResponsiveTest() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mobile-First Responsive Components</h1>
        <p className="text-muted-foreground">
          Resize your browser to see responsive behavior. All components are optimized for mobile first.
        </p>
      </div>

      {/* Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>
            Touch targets are larger on mobile (44px minimum), smaller on desktop
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex gap-2">
            <Button size="icon">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>
            16px font on mobile prevents iOS zoom. Taller on mobile for easier tapping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter your email" />
          </div>
        </CardContent>
      </Card>

      {/* Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
          <CardDescription>
            Dropdown items have proper spacing and touch targets on mobile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Option 1 - Longer text to test wrapping</SelectItem>
              <SelectItem value="option2">Option 2</SelectItem>
              <SelectItem value="option3">Option 3</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
          <CardDescription>
            Full-width on mobile with proper padding, centered on desktop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Responsive Dialog</DialogTitle>
                <DialogDescription>
                  This dialog adapts to all screen sizes. Notice the padding and button layout.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">
                  Mobile: Full width with smaller padding, stacked buttons
                </p>
                <p className="text-sm text-muted-foreground">
                  Desktop: Fixed width with larger padding, side-by-side buttons
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Dropdown Menu */}
      <Card>
        <CardHeader>
          <CardTitle>Dropdown Menu</CardTitle>
          <CardDescription>
            Menu items have increased touch target size on mobile (44px minimum)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Keyboard shortcuts</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Popover */}
      <Card>
        <CardHeader>
          <CardTitle>Popover</CardTitle>
          <CardDescription>
            Constrained to viewport width on mobile, fixed width on desktop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <h4 className="font-medium">Responsive Popover</h4>
                <p className="text-sm text-muted-foreground">
                  Mobile: Full width with 2rem margins, smaller padding
                </p>
                <p className="text-sm text-muted-foreground">
                  Desktop: Fixed 18rem width, larger padding
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
          <CardDescription>
            Tab triggers have larger touch targets on mobile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tab1">
            <TabsList>
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1">
              <p className="text-sm text-muted-foreground">
                Mobile: Taller tabs with more vertical padding for easier tapping
              </p>
              <p className="text-sm text-muted-foreground">
                Desktop: Standard height with minimal padding
              </p>
            </TabsContent>
            <TabsContent value="tab2">
              <p className="text-sm text-muted-foreground">Content for Tab 2</p>
            </TabsContent>
            <TabsContent value="tab3">
              <p className="text-sm text-muted-foreground">Content for Tab 3</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>Responsive Design Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Mobile First</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Base styles = mobile optimized</li>
                <li>Larger touch targets (44px min)</li>
                <li>16px font prevents iOS zoom</li>
                <li>Adequate spacing for thumbs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Desktop Enhancement</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Progressive enhancement via sm:</li>
                <li>Smaller, refined touch targets</li>
                <li>Tighter spacing for precision</li>
                <li>Optimized for mouse/trackpad</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
