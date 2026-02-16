import * as React from 'react';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center px-4 py-1.5 rounded-full
          text-sm font-medium text-white
          bg-[#1D4ED8]/80 border border-[rgba(255,255,255,0.2)]
          ${className}
        `}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Pill.displayName = 'Pill';

export { Pill };
