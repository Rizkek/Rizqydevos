'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string | undefined
  hint?: string | undefined
}

interface FieldFrameProps {
  inputId: string
  label: string
  error: string | undefined
  hint: string | undefined
  children: React.ReactNode
  trailing?: React.ReactNode
}

function describedBy(id: string, error: string | undefined, hint: string | undefined, extra?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`, extra].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

function FieldFrame({ inputId, label, error, hint, children, trailing }: FieldFrameProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--color-text)]">
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {hint && (
        <p id={`${inputId}-hint`} className="text-[12px] text-[var(--color-text-2)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-[13px] text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  )
}

// A label, an input, and the hint and error text wired to it with aria-describedby.
export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps & { trailing?: React.ReactNode }>(
  ({ label, error, hint, trailing, className, ...props }, ref) => {
    const id = React.useId()
    return (
      <FieldFrame inputId={id} label={label} error={error} hint={hint} trailing={trailing}>
        <Input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={className}
          {...props}
        />
      </FieldFrame>
    )
  },
)
TextField.displayName = 'TextField'

export const PasswordField = React.forwardRef<
  HTMLInputElement,
  Omit<TextFieldProps, 'type'> & {
    trailing?: React.ReactNode
    // Lets a pair of fields (password and confirmation) reveal together.
    revealed?: boolean
    onRevealedChange?: (revealed: boolean) => void
  }
>(({ label, error, hint, trailing, className, revealed, onRevealedChange, ...props }, ref) => {
  const id = React.useId()
  const [ownRevealed, setOwnRevealed] = React.useState(false)
  const isRevealed = revealed ?? ownRevealed
  const toggle = () => (onRevealedChange ? onRevealedChange(!isRevealed) : setOwnRevealed(!isRevealed))

  return (
    <FieldFrame inputId={id} label={label} error={error} hint={hint} trailing={trailing}>
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={isRevealed ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={cn('pr-10', className)}
          {...props}
        />
        <button
          type="button"
          onClick={toggle}
          aria-label={isRevealed ? 'Hide password' : 'Show password'}
          className="absolute right-0 top-0 inline-flex h-full w-9 items-center justify-center rounded-r-[var(--radius-md)] text-[var(--color-text-2)] hover:text-[var(--color-text)]"
        >
          {isRevealed ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
        </button>
      </div>
    </FieldFrame>
  )
})
PasswordField.displayName = 'PasswordField'
