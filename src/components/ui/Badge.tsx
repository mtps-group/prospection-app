import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'primary';
  className?: string;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gray-100 text-gray-700': variant === 'default',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-red-100 text-red-700': variant === 'error',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'bg-primary-light text-primary': variant === 'primary',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
