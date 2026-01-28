import * as React from "react"
import { Dot } from "lucide-react"

import { cn } from "@/lib/utils"

const InputOTPContext = React.createContext<{
  value: string[]
  onChange: (value: string[]) => void
} | null>(null)

const InputOTP = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string[]
    onChange?: (value: string[]) => void
    maxLength?: number
  }
>(({ className, value, onChange, maxLength, ...props }, ref) => (
  <InputOTPContext.Provider value={{ value: value || [], onChange: onChange || (() => {}) }}>
    <div ref={ref} className={cn("flex items-center gap-2", className)} {...props} />
  </InputOTPContext.Provider>
))
InputOTP.displayName = "InputOTP"

const InputOTPGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

const InputOTPSlot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    index: number
  }
>(({ className, index, ...props }, ref) => {
  const context = React.useContext(InputOTPContext)
  const [value, setValue] = React.useState("")

  React.useEffect(() => {
    if (context?.value && context.value[index]) {
      setValue(context.value[index])
    }
  }, [context?.value, index])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    if (context?.onChange) {
      const newValues = [...(context.value || [])]
      newValues[index] = newValue
      context.onChange(newValues)
    }
  }

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 items-center justify-center border border-input rounded-md text-sm transition-all",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
      {...props}
    >
      <input
        type="text"
        maxLength={1}
        value={value}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full border-0 bg-transparent text-center outline-none"
      />
      {value && <div className="pointer-events-none">{value}</div>}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

const InputOTPSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} role="separator" {...props}>
    <Dot className="h-4 w-4" />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
