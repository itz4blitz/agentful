import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Calendar } from '@/components/ui/calendar'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bold, Italic, Underline, Search, Calendar as CalendarIcon, Frame, Home, PieChart, Settings, MousePointerClick, Command as CommandIcon, Lock, PanelLeft, MessageSquare } from 'lucide-react'

export function MiscShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Toggle Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5" />
            Toggle
          </CardTitle>
          <CardDescription>Two-state buttons that can be toggled on or off.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Toggle aria-label="Toggle bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle aria-label="Toggle italic">
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle aria-label="Toggle underline">
              <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle variant="outline" aria-label="Toggle outline">
              Outline
            </Toggle>
          </div>
          <div className="flex items-center gap-4 pt-4 border-t">
            <span className="text-sm font-medium">Group:</span>
            <ToggleGroup type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <Underline className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Tooltip Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tooltip
          </CardTitle>
          <CardDescription>A popup that displays information related to an element.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[120px]">
          <TooltipProvider>
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary">And me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Another tooltip action</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Input OTP Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Input OTP
          </CardTitle>
          <CardDescription>Accessible one-time password input groups.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-4">
          <InputOTP maxLength={6}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </CardContent>
      </Card>

      {/* Command Section */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CommandIcon className="h-5 w-5" />
            Command
          </CardTitle>
          <CardDescription>Fast, composable, unstyled command menu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center w-full">
            <Command className="rounded-lg border shadow-sm w-full max-w-[450px]">
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Calendar</span>
                  </CommandItem>
                  <CommandItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </CommandItem>
                  <CommandItem>
                    <Frame className="mr-2 h-4 w-4" />
                    <span>Frame</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Actions">
                  <CommandItem>
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar
          </CardTitle>
          <CardDescription>A date field component.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Calendar
            mode="single"
            selected={new Date()}
            className="rounded-md border shadow-sm bg-background"
          />
        </CardContent>
      </Card>

      {/* Sidebar Section - Self-contained demo */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PanelLeft className="h-5 w-5" />
            Sidebar
          </CardTitle>
          <CardDescription>A composable, themeable sidebar component.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative h-[500px] w-full overflow-hidden rounded-lg border bg-background shadow-sm">
            <SidebarProvider defaultOpen={true}>
              <div className="flex h-full w-full">
                {/* Sidebar */}
                <Sidebar collapsible="icon">
                  <SidebarHeader>
                    <div className="flex items-center gap-2 px-2 py-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Home className="h-4 w-4" />
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Acme Inc</span>
                        <span className="truncate text-xs text-muted-foreground">Enterprise</span>
                      </div>
                    </div>
                  </SidebarHeader>
                  <SidebarContent>
                    <SidebarGroup>
                      <SidebarGroupLabel>Platform</SidebarGroupLabel>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          <SidebarMenuItem>
                            <SidebarMenuButton isActive tooltip="Overview">
                              <Home className="h-4 w-4" />
                              <span>Overview</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Analytics">
                              <PieChart className="h-4 w-4" />
                              <span>Analytics</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Settings">
                              <Settings className="h-4 w-4" />
                              <span>Settings</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                    <SidebarGroup className="mt-auto">
                      <SidebarGroupContent>
                        <SidebarMenu>
                           <SidebarMenuItem>
                            <SidebarMenuButton tooltip="Support">
                              <MessageSquare className="h-4 w-4" />
                              <span>Support</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </SidebarGroup>
                  </SidebarContent>
                  <SidebarFooter>
                     <div className="p-1">
                        <Card className="shadow-none border-0 bg-background/50">
                            <CardContent className="p-3 text-xs text-muted-foreground">
                                <div className="font-medium text-foreground mb-1">Upgrade to Pro</div>
                                Unlock all features and get unlimited access to our support team.
                            </CardContent>
                        </Card>
                    </div>
                  </SidebarFooter>
                </Sidebar>

                {/* Main Content Area */}
                <SidebarInset>
                  <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px]">
                    <SidebarTrigger />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">Dashboard</span>
                            <span>/</span>
                            <span>Overview</span>
                        </div>
                    </div>
                  </header>
                  <div className="flex-1 p-4 lg:p-6 bg-muted/5 overflow-auto">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                         <div className="aspect-video rounded-xl bg-muted/50 border border-dashed flex items-center justify-center text-sm text-muted-foreground">Chart 1</div>
                         <div className="aspect-video rounded-xl bg-muted/50 border border-dashed flex items-center justify-center text-sm text-muted-foreground">Chart 2</div>
                         <div className="aspect-video rounded-xl bg-muted/50 border border-dashed flex items-center justify-center text-sm text-muted-foreground">Stats</div>
                    </div>
                    <div className="min-h-[200px] flex-1 rounded-xl bg-muted/50 border border-dashed" />
                  </div>
                </SidebarInset>
              </div>
            </SidebarProvider>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
