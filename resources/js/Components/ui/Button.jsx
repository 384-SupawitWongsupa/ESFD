import React from 'react';
import { cn } from '@/lib/utils';

export function Button({
    className,
    variant = 'default',
    size = 'default',
    type = 'button',
    disabled,
    children,
    ...props
}) {
    const baseStyles =
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]';

    const variants = {
        default:
            'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs border border-emerald-800/20',
        primary:
            'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm',
        secondary:
            'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80',
        outline:
            'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900',
        ghost:
            'hover:bg-slate-100 text-slate-600 hover:text-slate-900',
        destructive:
            'bg-red-600 hover:bg-red-700 text-white shadow-xs',
        amber:
            'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300/80',
        link:
            'text-emerald-700 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
        default: 'h-10 px-4 py-2 text-xs',
        sm: 'h-8 rounded-lg px-3 text-[11px]',
        lg: 'h-12 rounded-xl px-6 text-sm font-semibold',
        icon: 'h-9 w-9 p-0',
    };

    return (
        <button
            type={type}
            disabled={disabled}
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            {children}
        </button>
    );
}

