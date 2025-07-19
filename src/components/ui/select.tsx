import React, { useState, useRef, useEffect } from "react";

interface SelectProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
}

interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

interface SelectValueProps {
  placeholder?: string;
  selectedValue?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  children,
  value,
  onValueChange,
  defaultValue,
}) => {
  const [selectedValue, setSelectedValue] = useState(
    value || defaultValue || ""
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {React.Children.map(children, (child) =>
        React.cloneElement(child as React.ReactElement, {
          selectedValue,
          isOpen,
          setIsOpen,
          onValueChange: handleValueChange,
        })
      )}
    </div>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps & any
>(
  (
    { className = "", children, selectedValue, isOpen, setIsOpen, ...props },
    ref
  ) => (
    <button
      ref={ref}
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      onClick={() => setIsOpen?.(!isOpen)}
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue: React.FC<SelectValueProps> = ({
  placeholder,
  selectedValue,
}) => (
  <span className={selectedValue ? "text-gray-900 dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}>
    {selectedValue || placeholder}
  </span>
);

const SelectContent = React.forwardRef<
  HTMLDivElement,
  SelectContentProps & any
>(({ children, isOpen, setIsOpen, onValueChange, className = "" }, ref) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setIsOpen?.(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute top-full mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-md z-50 ${className}`}
    >
      <div className="p-1">
        {React.Children.map(children, (child) =>
          React.cloneElement(child as React.ReactElement, {
            onValueChange,
            setIsOpen,
          })
        )}
      </div>
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps & any>(
  (
    { children, value, onValueChange, setIsOpen, className = "", ...props },
    ref
  ) => (
    <div
      ref={ref}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-gray-900 dark:text-gray-100 outline-none hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer ${className}`}
      onClick={() => {
        onValueChange?.(value);
        setIsOpen?.(false);
      }}
      {...props}
    >
      {children}
    </div>
  )
);
SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
export type {
  SelectProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectContentProps,
  SelectItemProps,
};
