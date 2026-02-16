import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  showArrow?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      showArrow = false,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1419] disabled:opacity-50 disabled:pointer-events-none";

    const variants = {
      primary:
        "bg-[#2563EB] text-white hover:bg-[#1d4ed8] shadow-[0_0_15px_rgba(37,99,235,0.35)] hover:shadow-[0_0_20px_rgba(37,99,235,0.45)] border-0",
      secondary:
        "bg-transparent text-white border border-[rgba(255,255,255,0.4)] hover:border-white hover:bg-white/5",
      ghost: "bg-transparent text-white hover:bg-white/5 border-0",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-5 py-2.5 text-base",
      lg: "px-6 py-3 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
        {showArrow && (
          <span className="inline-block ml-0.5" aria-hidden>
            →
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export { Button };
