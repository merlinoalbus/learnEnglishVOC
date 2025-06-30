// /src/hooks/useNotification.js
// This file contains a custom React hook for managing notifications.
// It provides functionality to show a notification message for a specified duration.

import { useState, useCallback } from 'react';

export const useNotification = () => {
  const [message, setMessage] = useState('');

  const showNotification = useCallback((msg, duration = 3000) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), duration);
  }, []);

  return { message, showNotification };
};