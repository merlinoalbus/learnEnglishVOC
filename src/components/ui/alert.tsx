import React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className = "", ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm ${className}`}
      {...props}
    />
  )
);
Alert.displayName = "Alert";

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const AlertDescription = React.forwardRef<
  HTMLDivElement,
  AlertDescriptionProps
>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`text-sm ${className}`} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
