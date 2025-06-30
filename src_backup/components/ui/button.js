// /src/components/ui/button.js
// This file contains the Button component with various styles and sizes.
// It is designed to be used in forms and other interactive elements, providing a consistent look and feel for buttons.
// It supports different variants like default, outline, ghost, and destructive, as well as size options like default, sm, and lg.
// The Button component can be customized with additional classes and styles as needed.

import React from 'react';

const Button = React.forwardRef(({
  className = "",
  variant = "default",
  size = "default",
  children,
  disabled = false,
  ...props
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground border-gray-300 hover:bg-gray-50",
    ghost: "hover:bg-accent hover:text-accent-foreground hover:bg-gray-100",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 bg-red-600 text-white hover:bg-red-700"
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md",
    lg: "h-11 px-8 rounded-md"
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      className={classes}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };