import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-brand-surface border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-slate',
            'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent',
            'transition-colors duration-200',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-brand-border hover:border-brand-slate',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-brand-surface border rounded-lg px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-slate resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent',
            'transition-colors duration-200',
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-brand-border hover:border-brand-slate',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-brand-muted">{hint}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
