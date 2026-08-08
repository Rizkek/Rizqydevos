import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-md)] text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] disabled:pointer-events-none disabled:opacity-50 gap-2",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm",
        destructive: "bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90 shadow-sm",
        outline: "border border-[var(--color-border-strong)] bg-transparent hover:bg-[var(--color-surface-2)] text-[var(--color-text)]",
        secondary: "bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-surface-3)]",
        ghost: "hover:bg-[var(--color-surface-2)] text-[var(--color-text-2)] hover:text-[var(--color-text)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3 py-2",
        sm: "h-7 rounded-[var(--radius-sm)] px-2 text-[12px]",
        lg: "h-10 rounded-[var(--radius-lg)] px-8 text-[14px]",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
