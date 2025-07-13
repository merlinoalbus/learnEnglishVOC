import React from "react";

// ===================================================
// Button Component Types & Interfaces
// ===================================================

type ButtonVariant = "default" | "outline" | "ghost" | "destructive" | "link";
type ButtonSize = "default" | "sm" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  disabled?: boolean;
}

// ===================================================
// Button Component Implementation
// ===================================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "default",
      size = "default",
      children,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variants: Record<ButtonVariant, string> = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 bg-slate-900 text-white hover:bg-slate-800",
      outline:
        "border border-input hover:bg-accent hover:text-accent-foreground border-gray-300 hover:bg-gray-50",
      ghost: "hover:bg-accent hover:text-accent-foreground hover:bg-gray-100",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700",
      link: "text-primary underline-offset-4 hover:underline text-blue-600 hover:text-blue-800",
    };

    const sizes: Record<ButtonSize, string> = {
      default: "h-10 py-2 px-4",
      sm: "h-9 px-3 rounded-md",
      lg: "h-11 px-8 rounded-md",
    };

    const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button className={classes} ref={ref} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// ===================================================
// Exports
// ===================================================

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
