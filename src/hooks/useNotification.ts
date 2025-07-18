import { useState, useCallback } from 'react';

interface UseNotificationReturn {
  message: string;
  showNotification: (msg: string, duration?: number) => void;
}

export const useNotification = (): UseNotificationReturn => {
  const [message, setMessage] = useState<string>('');

  const showNotification = useCallback((msg: string, duration: number = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  return { message, showNotification };
};