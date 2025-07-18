// /src/components/ui/textarea.js
// This file contains the Textarea component with various styles and properties.
//

import React from 'react';

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus:border-indigo-500 dark:focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };