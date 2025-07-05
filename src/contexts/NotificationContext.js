// src/contexts/NotificationContext.js
import React, { createContext, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  // Simplified notification functions
  const showSuccess = (message) => {
    console.log('✅ Success:', message);
    // You can replace this with your existing notification system
    // For now, we'll use browser alert for demo
    // alert('✅ ' + message);
  };

  const showError = (error, context = '') => {
    const message = error?.message || error || 'Unknown error';
    console.error('❌ Error:', context, message);
    // You can replace this with your existing notification system
    // alert('❌ ' + message);
  };

  const showWarning = (message) => {
    console.warn('⚠️ Warning:', message);
    // You can replace this with your existing notification system
    // alert('⚠️ ' + message);
  };

  const showNotification = (message, type = 'info') => {
    console.log(`📢 ${type.toUpperCase()}:`, message);
    // You can replace this with your existing notification system
  };

  const value = {
    showSuccess,
    showError,
    showWarning,
    showNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};