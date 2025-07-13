import React, { useState, useRef, useEffect } from "react";

// ===================================================
// Dropdown Menu Types & Interfaces
// ===================================================

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

interface DropdownMenuSeparatorProps {
  className?: string;
}

// ===================================================
// Alignment Styles - FIXED TYPE INDEXING
// ===================================================

type AlignmentOption = "start" | "center" | "end";

const alignmentStyles: Record<AlignmentOption, string> = {
  start: "left-0",
  center: "left-1/2 transform -translate-x-1/2",
  end: "right-0",
};

// Helper function to safely get alignment styles
const getAlignmentStyle = (align: AlignmentOption = "start"): string => {
  return alignmentStyles[align] || alignmentStyles.start;
};

// ===================================================
// Dropdown Menu Context
// ===================================================

interface DropdownContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownContext = React.createContext<DropdownContextType | null>(null);

const useDropdownContext = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used within DropdownMenu");
  }
  return context;
};

// ===================================================
// Component Implementations
// ===================================================

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }

    // FIXED: Explicit return for all code paths
    return undefined;
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }

    // FIXED: Explicit return for all code paths
    return undefined;
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownContext.Provider>
  );
};

// FIXED: Explicit return type and proper handling of asChild case
const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ children, asChild = false, ...props }, ref) => {
  const { setIsOpen, triggerRef } = useDropdownContext();

  const handleClick = () => {
    setIsOpen(true);
  };

  if (asChild && React.isValidElement(children)) {
    // FIXED: Safely handle asChild case without ref issues
    const childElement = children as React.ReactElement<any>;
    const childProps = {
      ...childElement.props,
      ...props,
      onClick: (e: React.MouseEvent) => {
        handleClick();
        if (childElement.props.onClick) {
          childElement.props.onClick(e);
        }
      },
    };

    return React.createElement(childElement.type, {
      ...childProps,
      ref: (node: HTMLElement | null) => {
        if (node) {
          triggerRef.current = node;
        }
        // Handle the forwarded ref safely
        if (typeof ref === "function") {
          ref(node as HTMLButtonElement);
        } else if (ref && node) {
          (ref as React.MutableRefObject<HTMLButtonElement>).current =
            node as HTMLButtonElement;
        }
      },
    });
  }

  // Default button case - always returns a React element
  return (
    <button
      ref={(node: HTMLButtonElement | null) => {
        if (node) {
          triggerRef.current = node;
        }
        if (typeof ref === "function") {
          ref(node);
        } else if (ref && node) {
          (ref as React.MutableRefObject<HTMLButtonElement>).current = node;
        }
      }}
      onClick={handleClick}
      className="inline-flex items-center justify-center"
      {...props}
    >
      {children}
    </button>
  );
});

// FIXED: Explicit return type
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ children, className = "", align = "start", ...props }, ref) => {
  const { isOpen } = useDropdownContext();

  // FIXED: Explicit null return for early exit
  if (!isOpen) {
    return null;
  }

  // FIXED: Safe alignment style retrieval
  const alignmentClass = getAlignmentStyle(align);

  // Always return a div element when isOpen is true
  return (
    <div
      ref={ref}
      className={`absolute top-full mt-2 min-w-[8rem] z-50 rounded-md border border-gray-200 bg-white p-1 shadow-md ${alignmentClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  DropdownMenuItemProps
>(({ children, disabled = false, className = "", onClick, ...props }, ref) => {
  const { setIsOpen } = useDropdownContext();

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (onClick) {
      onClick(e);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={ref}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 ${
        disabled ? "pointer-events-none opacity-50" : ""
      } ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
});

const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  DropdownMenuSeparatorProps
>(({ className = "", ...props }, ref) => (
  <div
    ref={ref}
    className={`-mx-1 my-1 h-px bg-gray-200 ${className}`}
    {...props}
  />
));

// ===================================================
// Display Names
// ===================================================

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";
DropdownMenuContent.displayName = "DropdownMenuContent";
DropdownMenuItem.displayName = "DropdownMenuItem";
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// ===================================================
// Exports
// ===================================================

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};

export type {
  DropdownMenuProps,
  DropdownMenuTriggerProps,
  DropdownMenuContentProps,
  DropdownMenuItemProps,
  DropdownMenuSeparatorProps,
};
