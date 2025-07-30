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
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<ButtonVariant, string> = {
      default:
        "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-purple-600 dark:hover:bg-purple-700 dark:focus:ring-purple-500",
      outline:
        "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
      ghost: 
        "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100",
      destructive:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-700 dark:hover:bg-red-800",
      link: 
        "text-indigo-600 underline-offset-4 hover:underline hover:text-indigo-800 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:text-purple-400 dark:hover:text-purple-300",
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
