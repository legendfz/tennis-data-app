import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-tennis-green text-white hover:bg-tennis-green-light',
  outline: 'border border-divider bg-transparent text-text-primary hover:bg-background-elevated',
  ghost: 'bg-transparent text-text-secondary hover:bg-background-elevated hover:text-text-primary',
  destructive: 'bg-result-loss/10 text-result-loss hover:bg-result-loss/20',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-btn',
  md: 'h-10 px-4 text-sm rounded-btn',
  lg: 'h-12 px-6 text-base rounded-btn',
  icon: 'size-10 rounded-btn',
};

/**
 * Base button component with TennisHQ design system variants.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tennis-green focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
