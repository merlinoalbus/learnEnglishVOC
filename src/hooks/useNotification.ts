// =====================================================
// 📁 src/hooks/useNotification.ts - Type-Safe Notification Hook
// =====================================================

import { useCallback, useEffect, useRef, useState } from 'react';

interface NotificationHookReturn {
  message: string;
  showNotification: (msg: string, duration?: number) => void;
}

export const useNotification = (): NotificationHookReturn => {
  const [message, setMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((msg: string, duration: number = 3000): void => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(msg);
    
    timeoutRef.current = setTimeout(() => {
      setMessage('');
      timeoutRef.current = null;
    }, duration);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { 
    message, 
    showNotification 
  };
};