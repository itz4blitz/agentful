"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface CommandPopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const CommandPopover = ({ open, onOpenChange, children }: CommandPopoverProps) => {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {children}
    </Popover>
  )
}

const CommandPopoverTrigger = React.forwardRef<
  React.ElementRef<typeof PopoverTrigger>,
  React.ComponentPropsWithoutRef<typeof PopoverTrigger>
>(({ children, ...props }, ref) => (
  <PopoverTrigger ref={ref} {...props}>
    {children}
  </PopoverTrigger>
))

CommandPopoverTrigger.displayName = "CommandPopoverTrigger"

const CommandPopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, ...props }, ref) => (
  <PopoverContent
    ref={ref}
    className={cn("p-0 w-[200px]", className)}
    align="start"
    {...props}
  />
))

CommandPopoverContent.displayName = "CommandPopoverContent"

export { CommandPopover, CommandPopoverTrigger, CommandPopoverContent }
