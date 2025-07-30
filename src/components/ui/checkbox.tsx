import React from "react";

// ===================================================
// Checkbox Component Types & Interfaces
// ===================================================

interface CheckboxProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "checked" | "onChange"
  > {
  className?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

// ===================================================
// Checkbox Component Implementation
// ===================================================

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", checked, onCheckedChange, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={`h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 ${className}`}
      {...props}
    />
  )
);

Checkbox.displayName = "Checkbox";

// ===================================================
// Exports
// ===================================================

export { Checkbox };
export type { CheckboxProps };
