import { ButtonHTMLAttributes, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Button({ className, type = 'button', onClick, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const clickHandler: ButtonHTMLAttributes<HTMLButtonElement>['onClick'] = (event) => {
    console.debug('[ui][button] click', {
      type,
      disabled: props.disabled ?? false,
      className,
      label: typeof children === 'string' ? children : '[non-text]'
    });
    onClick?.(event);
  };

  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-primary-foreground font-medium transition hover:opacity-90 disabled:opacity-60',
        className
      )}
      onClick={clickHandler}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border bg-card p-4 shadow-sm', className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn('w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary', className)}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />;
}
