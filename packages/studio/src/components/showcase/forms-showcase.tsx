import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, MousePointerClick, Type, AlignLeft, CheckSquare, ListFilter, ToggleLeft, Sliders, ChevronsUpDown } from 'lucide-react'
import { format } from 'date-fns'

export function FormsShowcase() {
  const [date, setDate] = useState<Date | undefined>(new Date())

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Buttons Section - spans 2 columns on tablet+ */}
      <Card className="lg:col-span-2">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MousePointerClick className="h-4 w-4 sm:h-5 sm:w-5" />
            Buttons
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Interactive elements that trigger actions.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button size="sm" sm:size="default">Default</Button>
            <Button size="sm" sm:size="default" variant="secondary">Secondary</Button>
            <Button size="sm" sm:size="default" variant="destructive">Destructive</Button>
            <Button size="sm" sm:size="default" variant="outline">Outline</Button>
            <Button size="sm" sm:size="default" variant="ghost">Ghost</Button>
            <Button size="sm" sm:size="default" variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="sm" sm:size="default" disabled>Disabled</Button>
          </div>
        </CardContent>
      </Card>

      {/* Inputs Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Type className="h-4 w-4 sm:h-5 sm:w-5" />
            Inputs
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Fundamental text entry fields.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default" className="text-xs sm:text-sm">Default Input</Label>
            <Input id="default" placeholder="Enter text..." className="h-9 sm:h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="disabled" className="text-xs sm:text-sm">Disabled Input</Label>
            <Input id="disabled" disabled placeholder="Disabled..." className="h-9 sm:h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="with-error" className="text-xs sm:text-sm">Input with Error</Label>
            <Input id="with-error" placeholder="Error state" className="h-9 sm:h-10" />
            <p className="text-[0.75rem] sm:text-xs text-destructive font-medium">This field is required</p>
          </div>
        </CardContent>
      </Card>

      {/* Textarea Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <AlignLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Textarea
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">For multi-line text input.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="message" className="text-xs sm:text-sm">Message</Label>
            <Textarea id="message" placeholder="Type your message..." rows={5} className="resize-none text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Checkbox Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            Checkbox
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Binary selection controls.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Checkbox id="terms1" className="h-4 w-4 sm:h-5 sm:w-5" />
            <Label htmlFor="terms1" className="text-xs sm:text-sm cursor-pointer">Accept terms and conditions</Label>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Checkbox id="terms2" defaultChecked className="h-4 w-4 sm:h-5 sm:w-5" />
            <Label htmlFor="terms2" className="text-xs sm:text-sm cursor-pointer">Subscribe to newsletter</Label>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Checkbox id="terms3" disabled className="h-4 w-4 sm:h-5 sm:w-5" />
            <Label htmlFor="terms3" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">Disabled option</Label>
          </div>
        </CardContent>
      </Card>

      {/* Radio Group Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ListFilter className="h-4 w-4 sm:h-5 sm:w-5" />
            Radio Group
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Select one option from a set.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <RadioGroup defaultValue="option1" className="space-y-2 sm:space-y-3">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <RadioGroupItem value="option1" id="r1" className="h-4 w-4 sm:h-5 sm:w-5" />
              <Label htmlFor="r1" className="text-xs sm:text-sm cursor-pointer">Option 1</Label>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <RadioGroupItem value="option2" id="r2" className="h-4 w-4 sm:h-5 sm:w-5" />
              <Label htmlFor="r2" className="text-xs sm:text-sm cursor-pointer">Option 2</Label>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <RadioGroupItem value="option3" id="r3" className="h-4 w-4 sm:h-5 sm:w-5" />
              <Label htmlFor="r3" className="text-xs sm:text-sm cursor-pointer">Option 3</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Switch Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ToggleLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Switch
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Toggle between two states.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-4 sm:space-y-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="airplane-mode" className="flex flex-col space-y-0.5 sm:space-y-1 cursor-pointer flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-medium truncate">Airplane Mode</span>
              <span className="text-[10px] sm:text-xs font-normal leading-snug text-muted-foreground truncate">Disable all wireless connections</span>
            </Label>
            <Switch id="airplane-mode" className="shrink-0" />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-0.5 sm:space-y-1 cursor-pointer flex-1 min-w-0">
              <span className="text-xs sm:text-sm font-medium truncate">Notifications</span>
              <span className="text-[10px] sm:text-xs font-normal leading-snug text-muted-foreground truncate">Receive updates via email</span>
            </Label>
            <Switch id="notifications" defaultChecked className="shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Slider Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sliders className="h-4 w-4 sm:h-5 sm:w-5" />
            Slider
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Select a value from a range.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 space-y-6 sm:space-y-8 py-4 sm:py-6">
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm">Volume</Label>
            <Slider defaultValue={[50]} max={100} step={1} className="py-1" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm">Range</Label>
            <Slider defaultValue={[25, 75]} max={100} step={1} className="py-1" />
          </div>
        </CardContent>
      </Card>

      {/* Select Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ChevronsUpDown className="h-4 w-4 sm:h-5 sm:w-5" />
            Select
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Dropdown selection menu.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="space-y-2">
            <Label htmlFor="select" className="text-xs sm:text-sm">Choose an option</Label>
            <Select>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
                <SelectItem value="option2">Option 2</SelectItem>
                <SelectItem value="option3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date Picker Section */}
      <Card>
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            Date Picker
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Select a date from a calendar.</CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal h-9 sm:h-10 text-sm">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>
    </div>
  )
}