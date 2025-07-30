import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from "react";

// =====================================================
// 🎯 TYPE DEFINITIONS
// =====================================================

type NotificationType = "success" | "error" | "warning" | "info";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
}

type NotificationAction = 
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: number }
  | { type: "CLEAR_ALL" };

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: NotificationType, duration?: number) => number;
  showError: (error: Error | string, context?: string) => number;
  showSuccess: (message: string) => number;
  showWarning: (message: string) => number;
  clearAllNotifications: () => void;
}

// =====================================================
// 🏗️ SETUP CONTEXT REACT
// =====================================================

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// =====================================================
// 🔄 REDUCER PER GESTIONE STATO NOTIFICHE
// =====================================================

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
      };

    case "CLEAR_ALL":
      return { ...state, notifications: [] };

    default:
      return state;
  }
};

// =====================================================
// 🧠 MAPPING ERRORI USER-FRIENDLY
// =====================================================

const getUserFriendlyError = (errorMessage: string, context: string): string => {
  const errorMap: Record<string, string> = {
    JSON: "❌ File JSON non valido",
    localStorage: "❌ Errore salvataggio dati",
    Network: "❌ Errore di connessione",
    "Word already exists": "⚠️ Parola già esistente",
    "English word and Italian translation are required": "⚠️ Campi obbligatori mancanti",
    "All words already exist": "⚠️ Tutte le parole sono già presenti",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return message;
    }
  }

  return `❌ Errore ${context}: ${errorMessage}`;
};

// =====================================================
// 🏭 NOTIFICATION PROVIDER COMPONENT
// =====================================================

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
  });

  // =====================================================
  // 🔧 FUNZIONE CORE: MOSTRA NOTIFICA GENERICA
  // =====================================================

  const showNotification = useCallback(
    (message: string, type: NotificationType = "success", duration: number = 3000): number => {
      const id = Date.now() + Math.random();

      const notificationObject: Notification = {
        id,
        message,
        type,
        timestamp: Date.now(),
      };

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: notificationObject,
      });

      setTimeout(() => {
        dispatch({
          type: "REMOVE_NOTIFICATION",
          payload: id,
        });
      }, duration);

      return id;
    },
    []
  );

  // =====================================================
  // 🔴 FUNZIONE SPECIALIZZATA: MOSTRA ERRORE
  // =====================================================

  const showError = useCallback(
    (error: Error | string, context: string = ""): number => {
      console.error(`❌ Error in ${context}:`, error);

      const errorMessage = typeof error === 'string' ? error : error.message || error.toString();
      const userFriendlyMessage = getUserFriendlyError(errorMessage, context);

      return showNotification(userFriendlyMessage, "error", 5000);
    },
    [showNotification]
  );

  // =====================================================
  // 🟢 FUNZIONE SPECIALIZZATA: MOSTRA SUCCESSO
  // =====================================================

  const showSuccess = useCallback(
    (message: string): number => {
      return showNotification(message, "success");
    },
    [showNotification]
  );

  // =====================================================
  // 🟡 FUNZIONE SPECIALIZZATA: MOSTRA WARNING
  // =====================================================

  const showWarning = useCallback(
    (message: string): number => {
      return showNotification(message, "warning", 4000);
    },
    [showNotification]
  );

  // =====================================================
  // 🎁 API COMPLETA CONTEXT VALUE
  // =====================================================

  const value: NotificationContextType = {
    notifications: state.notifications,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    clearAllNotifications: useCallback(() => {
      dispatch({ type: "CLEAR_ALL" });
    }, []),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// =====================================================
// 🪝 CUSTOM HOOK PER CONSUMARE CONTEXT
// =====================================================

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }

  return context;
};