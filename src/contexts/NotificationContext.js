import React, { createContext, useContext, useReducer, useCallback } from 'react';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
    case 'CLEAR_ALL':
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

const getUserFriendlyError = (errorMessage, context) => {
  const errorMap = {
    'JSON': '❌ File JSON non valido',
    'localStorage': '❌ Errore salvataggio dati',
    'Network': '❌ Errore di connessione',
    'Word already exists': '⚠️ Parola già esistente',
    'English word and Italian translation are required': '⚠️ Campi obbligatori mancanti',
    'All words already exist': '⚠️ Tutte le parole sono già presenti'
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return message;
    }
  }

  return `❌ Errore ${context}: ${errorMessage}`;
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: []
  });

  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { id, message, type, timestamp: Date.now() }
    });

    setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, duration);

    return id;
  }, []);

  const showError = useCallback((error, context = '') => {
    console.error(`❌ Error in ${context}:`, error);
    
    const errorMessage = error.message || error.toString();
    const userFriendlyMessage = getUserFriendlyError(errorMessage, context);
    
    return showNotification(userFriendlyMessage, 'error', 5000);
  }, [showNotification]);

  const showSuccess = useCallback((message) => {
    return showNotification(message, 'success');
  }, [showNotification]);

  const showWarning = useCallback((message) => {
    return showNotification(message, 'warning', 4000);
  }, [showNotification]);

  const value = {
    notifications: state.notifications,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    clearAllNotifications: useCallback(() => {
      dispatch({ type: 'CLEAR_ALL' });
    }, [])
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
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};