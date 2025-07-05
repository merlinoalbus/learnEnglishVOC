// =====================================================
// 📁 src/store/NotificationStore.js - Optimized Notification Management
// =====================================================
// Duplica e ottimizza la logica di NotificationContext.js per dual-system testing

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { generateId } from '../utils';
import { UI_CONFIG, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants/appConstants';

// =====================================================
// Notification State Structure (ottimizzata)
// =====================================================

const initialState = {
  notifications: [],
  maxVisible: UI_CONFIG.notifications.maxVisible,
  defaultDuration: UI_CONFIG.notifications.defaultDuration
};

// =====================================================
// Action Types
// =====================================================

const ActionTypes = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL_NOTIFICATIONS: 'CLEAR_ALL_NOTIFICATIONS',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION'
};

// =====================================================
// Notification Types
// =====================================================

export const NotificationTypes = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// =====================================================
// Reducer (ottimizzato)
// =====================================================

const notificationReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.ADD_NOTIFICATION: {
      const newNotification = {
        id: generateId(),
        timestamp: Date.now(),
        ...action.payload
      };
      
      // Maintain max visible limit
      const updatedNotifications = [newNotification, ...state.notifications]
        .slice(0, state.maxVisible);
      
      return {
        ...state,
        notifications: updatedNotifications
      };
    }
    
    case ActionTypes.REMOVE_NOTIFICATION: {
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
      
      return {
        ...state,
        notifications: filteredNotifications
      };
    }
    
    case ActionTypes.CLEAR_ALL_NOTIFICATIONS:
      return {
        ...state,
        notifications: []
      };
    
    case ActionTypes.UPDATE_NOTIFICATION: {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, ...action.payload.updates }
          : notification
      );
      
      return {
        ...state,
        notifications: updatedNotifications
      };
    }
    
    default:
      return state;
  }
};

// =====================================================
// Store Context
// =====================================================

const NotificationStoreContext = createContext(null);

// =====================================================
// Store Provider Component
// =====================================================

export const NotificationStoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // =====================================================
  // Auto-remove functionality (ottimizzato)
  // =====================================================

  const scheduleRemoval = useCallback((id, duration) => {
    if (duration > 0) {
      setTimeout(() => {
        dispatch({ 
          type: ActionTypes.REMOVE_NOTIFICATION, 
          payload: id 
        });
      }, duration);
    }
  }, []);

  // =====================================================
  // Core Notification Functions (memoized)
  // =====================================================

  const addNotification = useCallback((message, type = NotificationTypes.INFO, options = {}) => {
    const notification = {
      message,
      type,
      duration: options.duration ?? state.defaultDuration,
      persistent: options.persistent ?? false,
      action: options.action || null,
      icon: options.icon || null,
      ...options
    };

    dispatch({ 
      type: ActionTypes.ADD_NOTIFICATION, 
      payload: notification 
    });

    // Schedule auto-removal if not persistent
    if (!notification.persistent && notification.duration > 0) {
      // Get the ID that will be generated (last notification + 1)
      const newId = generateId();
      scheduleRemoval(newId, notification.duration);
    }

    return newId;
  }, [state.defaultDuration, scheduleRemoval]);

  const removeNotification = useCallback((id) => {
    dispatch({ 
      type: ActionTypes.REMOVE_NOTIFICATION, 
      payload: id 
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ALL_NOTIFICATIONS });
  }, []);

  const updateNotification = useCallback((id, updates) => {
    dispatch({ 
      type: ActionTypes.UPDATE_NOTIFICATION, 
      payload: { id, updates } 
    });
  }, []);

  // =====================================================
  // Specialized Notification Functions (memoized)
  // =====================================================

  const showSuccess = useCallback((message, options = {}) => {
    return addNotification(message, NotificationTypes.SUCCESS, {
      icon: '✅',
      duration: 3000,
      ...options
    });
  }, [addNotification]);

  const showError = useCallback((error, context = '', options = {}) => {
    let message;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      message = ERROR_MESSAGES.generic;
    }
    
    // Add context if provided
    if (context) {
      message = `${context}: ${message}`;
    }
    
    console.error('🚨 Notification Error:', { error, context, message });
    
    return addNotification(message, NotificationTypes.ERROR, {
      icon: '❌',
      duration: 5000, // Longer duration for errors
      persistent: options.persistent ?? false,
      ...options
    });
  }, [addNotification]);

  const showWarning = useCallback((message, options = {}) => {
    return addNotification(message, NotificationTypes.WARNING, {
      icon: '⚠️',
      duration: 4000,
      ...options
    });
  }, [addNotification]);

  const showInfo = useCallback((message, options = {}) => {
    return addNotification(message, NotificationTypes.INFO, {
      icon: 'ℹ️',
      duration: 3000,
      ...options
    });
  }, [addNotification]);

  // =====================================================
  // Advanced Notification Functions
  // =====================================================

  const showLoadingNotification = useCallback((message, options = {}) => {
    return addNotification(message, NotificationTypes.INFO, {
      icon: '⏳',
      persistent: true, // Loading notifications should be manually dismissed
      ...options
    });
  }, [addNotification]);

  const updateLoadingNotification = useCallback((id, message, type = NotificationTypes.SUCCESS) => {
    updateNotification(id, {
      message,
      type,
      icon: type === NotificationTypes.SUCCESS ? '✅' : 
            type === NotificationTypes.ERROR ? '❌' : 'ℹ️',
      persistent: false,
      duration: 3000
    });
    
    // Auto-remove after update
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  }, [updateNotification, removeNotification]);

  const showProgressNotification = useCallback((message, progress = 0, options = {}) => {
    return addNotification(message, NotificationTypes.INFO, {
      icon: '📊',
      progress,
      persistent: true,
      ...options
    });
  }, [addNotification]);

  const updateProgressNotification = useCallback((id, progress, message) => {
    updateNotification(id, {
      progress,
      message: message || undefined
    });
    
    // Auto-complete when progress reaches 100%
    if (progress >= 100) {
      setTimeout(() => {
        updateNotification(id, {
          type: NotificationTypes.SUCCESS,
          icon: '✅',
          persistent: false,
          duration: 2000
        });
        
        setTimeout(() => {
          removeNotification(id);
        }, 2000);
      }, 500);
    }
  }, [updateNotification, removeNotification]);

  // =====================================================
  // Notification Queue Management
  // =====================================================

  const getNotificationsByType = useCallback((type) => {
    return state.notifications.filter(notification => notification.type === type);
  }, [state.notifications]);

  const hasNotificationType = useCallback((type) => {
    return state.notifications.some(notification => notification.type === type);
  }, [state.notifications]);

  const getLatestNotification = useCallback(() => {
    return state.notifications[0] || null;
  }, [state.notifications]);

  const getOldestNotification = useCallback(() => {
    return state.notifications[state.notifications.length - 1] || null;
  }, [state.notifications]);

  // =====================================================
  // Batch Operations
  // =====================================================

  const showBatchNotifications = useCallback((notifications) => {
    notifications.forEach(({ message, type, options }) => {
      addNotification(message, type, options);
    });
  }, [addNotification]);

  const clearNotificationsByType = useCallback((type) => {
    const toRemove = state.notifications
      .filter(notification => notification.type === type)
      .map(notification => notification.id);
    
    toRemove.forEach(id => {
      removeNotification(id);
    });
  }, [state.notifications, removeNotification]);

  // =====================================================
  // Statistics and Analytics
  // =====================================================

  const getNotificationStats = useMemo(() => {
    const total = state.notifications.length;
    const byType = state.notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {});
    
    return {
      total,
      byType,
      hasErrors: byType[NotificationTypes.ERROR] > 0,
      hasWarnings: byType[NotificationTypes.WARNING] > 0
    };
  }, [state.notifications]);

  // =====================================================
  // Context Value (memoized for performance)
  // =====================================================

  const contextValue = useMemo(() => ({
    // State
    notifications: state.notifications,
    
    // Core functions
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    
    // Specialized functions
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Advanced functions
    showLoadingNotification,
    updateLoadingNotification,
    showProgressNotification,
    updateProgressNotification,
    
    // Query functions
    getNotificationsByType,
    hasNotificationType,
    getLatestNotification,
    getOldestNotification,
    
    // Batch functions
    showBatchNotifications,
    clearNotificationsByType,
    
    // Analytics
    notificationStats: getNotificationStats,
    
    // Constants
    NotificationTypes
  }), [
    state.notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoadingNotification,
    updateLoadingNotification,
    showProgressNotification,
    updateProgressNotification,
    getNotificationsByType,
    hasNotificationType,
    getLatestNotification,
    getOldestNotification,
    showBatchNotifications,
    clearNotificationsByType,
    getNotificationStats
  ]);

  return (
    <NotificationStoreContext.Provider value={contextValue}>
      {children}
    </NotificationStoreContext.Provider>
  );
};

// =====================================================
// Store Hook
// =====================================================

export const useNotificationStore = () => {
  const context = useContext(NotificationStoreContext);
  if (!context) {
    throw new Error('useNotificationStore must be used within a NotificationStoreProvider');
  }
  return context;
};

// =====================================================
// Export Types for Type Safety
// =====================================================

export { ActionTypes as NotificationActionTypes };