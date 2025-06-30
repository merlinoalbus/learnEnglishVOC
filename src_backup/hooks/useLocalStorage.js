// /src/hooks/useLocalStorage.js
// This file contains a custom React hook for managing local storage.
// It allows you to store and retrieve values from local storage with automatic JSON serialization and deserialization
// while providing a default initial value.
// The hook also handles errors gracefully, ensuring that the application can continue to function even if local storage is not available or if there are issues with the stored data.
// The `useLocalStorage` hook can be used in any React component to persist state across page reloads or sessions, making it useful for settings, user preferences, or any data that needs to be retained between visits.
// It returns the stored value and a function to update it, which will also update the local storage accordingly.
// It is a convenient way to manage state that needs to be persistent in a React application.

import { useState } from 'react';

export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [storedValue, setValue];
};