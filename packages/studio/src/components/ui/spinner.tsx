import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SpinnerProps extends React.ComponentProps<"svg"> {
  size?: "default" | "sm" | "lg"
}

function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(
        "animate-spin",
        {
          "size-4": size === "default",
          "size-3": size === "sm",
          "size-6": size === "lg",
        },
        className
      )}
      {...props}
    />
  )
}

export { Spinner }
