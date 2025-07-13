// =====================================================
// 📁 src/contexts/FirebaseContext.tsx - Firebase Context TypeScript
// =====================================================

/**
 * FIREBASE CONTEXT TypeScript per Vocabulary Master
 * ✅ Type-safe integration con tutti i types definiti
 * ✅ Integrazione con AppProvider esistente
 * ✅ Inizializzazione Firebase all'avvio
 * ✅ Stato loading/error tipizzato
 * ✅ Provider pattern compatibile con architettura esistente
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  initializeFirebase,
  getFirebaseStatus,
  type FirebaseInitResult,
  type FirebaseStatus,
} from "../config/firebase";

// =====================================================
// 🏗️ TYPES & INTERFACES
// =====================================================

/**
 * Firebase Context State
 * Type-safe stato Firebase
 */
interface FirebaseState {
  initialized: boolean;
  loading: boolean;
  error: Error | null;
  retryCount: number;
  initResult?: FirebaseInitResult;
}

/**
 * Firebase Context Value
 * Type-safe context value
 */
interface FirebaseContextValue extends FirebaseState {
  // Actions
  retryInitialization: () => void;

  // Utils
  getFirebaseStatus: () => FirebaseStatus;

  // Computed
  isReady: boolean;
}

/**
 * Firebase Provider Props
 * Type-safe props
 */
interface FirebaseProviderProps {
  children: ReactNode;
}

// =====================================================
// 🏗️ CONTEXT SETUP
// =====================================================

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

// =====================================================
// 🔥 FIREBASE PROVIDER COMPONENT
// =====================================================

/**
 * FirebaseProvider
 * Type-safe Firebase provider component
 * RESPONSABILITÀ:
 * - Inizializza Firebase all'avvio
 * - Gestisce stato loading/error tipizzato
 * - Fornisce Firebase status type-safe ai figli
 * - Si integra con ErrorTracker esistente
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  // =====================================================
  // 📊 STATO FIREBASE TYPE-SAFE
  // =====================================================

  const [firebaseState, setFirebaseState] = useState<FirebaseState>({
    initialized: false,
    loading: true,
    error: null,
    retryCount: 0,
  });

  // =====================================================
  // 🚀 INITIALIZATION EFFECT
  // =====================================================

  useEffect(() => {
    async function init(): Promise<void> {
      try {
        console.log("🔥 Starting Firebase initialization...");

        // Reset error state se retry
        setFirebaseState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Initialize Firebase - type-safe result
        const initResult: FirebaseInitResult = await initializeFirebase();

        if (initResult.success) {
          // Success state
          setFirebaseState({
            initialized: true,
            loading: false,
            error: null,
            retryCount: 0,
            initResult,
          });

          // Debug info in development
          if (process.env.NODE_ENV === "development") {
            console.log("🔍 Firebase Status:", getFirebaseStatus());
            console.log("🔍 Init Result:", initResult);
          }

          console.log("✅ Firebase ready!");
        } else {
          // Handle initialization failure
          throw initResult.error || new Error("Firebase initialization failed");
        }
      } catch (error) {
        console.error("❌ Firebase initialization failed:", error);

        // Error state - type-safe error handling
        setFirebaseState((prev) => ({
          initialized: false,
          loading: false,
          error: error as Error,
          retryCount: prev.retryCount + 1,
        }));

        // Integrazione con ErrorTracker esistente (se disponibile)
        // Type-safe window access
        const windowWithErrorTracker = window as any;
        if (windowWithErrorTracker.ErrorTracker?.logError) {
          windowWithErrorTracker.ErrorTracker.logError(
            error,
            "Firebase Initialization",
            {
              retryCount: firebaseState.retryCount,
              timestamp: new Date().toISOString(),
            }
          );
        }
      }
    }

    init();
  }, [firebaseState.retryCount]); // Re-run quando retry

  // =====================================================
  // 🔄 ACTIONS TYPE-SAFE
  // =====================================================

  const retryInitialization = (): void => {
    if (firebaseState.retryCount < 3) {
      setFirebaseState((prev) => ({
        ...prev,
        retryCount: prev.retryCount + 1,
      }));
    }
  };

  // =====================================================
  // 🎁 CONTEXT VALUE TYPE-SAFE
  // =====================================================

  const value: FirebaseContextValue = {
    // Stato Firebase
    ...firebaseState,

    // Actions
    retryInitialization,

    // Utils
    getFirebaseStatus,

    // Computed properties
    isReady:
      firebaseState.initialized &&
      !firebaseState.loading &&
      !firebaseState.error,
  };

  // =====================================================
  // 🎨 CONDITIONAL RENDERING
  // =====================================================

  // Loading state
  if (firebaseState.loading) {
    return <FirebaseLoadingScreen />;
  }

  // Error state
  if (firebaseState.error && !firebaseState.initialized) {
    return (
      <FirebaseErrorScreen
        error={firebaseState.error}
        retryCount={firebaseState.retryCount}
        onRetry={retryInitialization}
      />
    );
  }

  // Success - render children con context
  return (
    <FirebaseContext.Provider value={value}>
      {children}

      {/* Debug indicator in development */}
      {process.env.NODE_ENV === "development" && firebaseState.initialized && (
        <FirebaseDebugIndicator initResult={firebaseState.initResult} />
      )}
    </FirebaseContext.Provider>
  );
};

// =====================================================
// 🎨 UI COMPONENTS TYPE-SAFE
// =====================================================

/**
 * Firebase Loading Screen
 * Type-safe loading component
 */
const FirebaseLoadingScreen: React.FC = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#f8fafc",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}
  >
    <div
      style={{
        width: "50px",
        height: "50px",
        border: "3px solid #e2e8f0",
        borderTop: "3px solid #3b82f6",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginBottom: "20px",
      }}
    />
    <h2 style={{ color: "#1e293b", margin: "0 0 10px 0" }}>
      🔥 Initializing Firebase...
    </h2>
    <p style={{ color: "#64748b", margin: 0 }}>
      Setting up authentication and database
    </p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

/**
 * Firebase Error Screen Props
 */
interface FirebaseErrorScreenProps {
  error: Error;
  retryCount: number;
  onRetry: () => void;
}

/**
 * Firebase Error Screen
 * Type-safe error component
 */
const FirebaseErrorScreen: React.FC<FirebaseErrorScreenProps> = ({
  error,
  retryCount,
  onRetry,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      backgroundColor: "#fef2f2",
      fontFamily: "system-ui, -apple-system, sans-serif",
      padding: "20px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>

    <h2
      style={{
        color: "#dc2626",
        margin: "0 0 15px 0",
        fontSize: "24px",
      }}
    >
      Firebase Initialization Failed
    </h2>

    <p
      style={{
        color: "#7f1d1d",
        margin: "0 0 20px 0",
        maxWidth: "500px",
        lineHeight: "1.5",
      }}
    >
      {error.message}
    </p>

    <div
      style={{
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        justifyContent: "center",
      }}
    >
      {retryCount < 3 && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: "#dc2626",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "6px",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          🔄 Retry ({retryCount}/3)
        </button>
      )}

      <button
        onClick={() => window.location.reload()}
        style={{
          backgroundColor: "#6b7280",
          color: "white",
          border: "none",
          padding: "12px 24px",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        🔄 Reload Page
      </button>
    </div>

    {process.env.NODE_ENV === "development" && (
      <details
        style={{
          marginTop: "30px",
          textAlign: "left",
          backgroundColor: "#fee2e2",
          padding: "15px",
          borderRadius: "6px",
          maxWidth: "600px",
        }}
      >
        <summary
          style={{
            color: "#991b1b",
            cursor: "pointer",
            fontWeight: "600",
            marginBottom: "10px",
          }}
        >
          🔧 Developer Debug Info
        </summary>
        <pre
          style={{
            fontSize: "12px",
            color: "#7f1d1d",
            overflow: "auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(
            {
              error: {
                name: error.name,
                message: error.message,
                stack: error.stack?.split("\n").slice(0, 5).join("\n"),
              },
              retryCount,
              environment: process.env.NODE_ENV,
              firebaseConfig: {
                hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
                hasAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
                hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID,
                hasStorageBucket:
                  !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
                hasMessagingSenderId:
                  !!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
                hasAppId: !!process.env.REACT_APP_FIREBASE_APP_ID,
              },
            },
            null,
            2
          )}
        </pre>
      </details>
    )}
  </div>
);

/**
 * Firebase Debug Indicator Props
 */
interface FirebaseDebugIndicatorProps {
  initResult?: FirebaseInitResult;
}

/**
 * Firebase Debug Indicator
 * Type-safe debug component
 */
const FirebaseDebugIndicator: React.FC<FirebaseDebugIndicatorProps> = ({
  initResult,
}) => (
  <div
    style={{
      position: "fixed",
      bottom: "10px",
      right: "10px",
      backgroundColor: "#10b981",
      color: "white",
      padding: "8px 12px",
      borderRadius: "6px",
      fontSize: "12px",
      fontFamily: "monospace",
      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      zIndex: 9999,
      cursor: "pointer",
    }}
    title={`Firebase Ready - Firestore: ${
      initResult?.firestorePersistence ? "✅" : "❌"
    }, Auth: ${initResult?.authPersistence ? "✅" : "❌"}`}
  >
    🔥 Firebase Ready
  </div>
);

// =====================================================
// 🪝 CUSTOM HOOK TYPE-SAFE
// =====================================================

/**
 * useFirebase hook
 * Type-safe hook per accedere al Firebase context
 * UTILIZZO: const { isReady, initialized, error } = useFirebase();
 */
export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);

  if (!context) {
    throw new Error("useFirebase must be used within FirebaseProvider");
  }

  return context;
};

// =====================================================
// 🔧 UTILITY HOOKS
// =====================================================

/**
 * useFirebaseReady hook
 * Type-safe hook che restituisce solo quando Firebase è ready
 */
export const useFirebaseReady = (): boolean => {
  const { isReady } = useFirebase();
  return isReady;
};

/**
 * useFirebaseError hook
 * Type-safe hook per accedere agli errori Firebase
 */
export const useFirebaseError = (): Error | null => {
  const { error } = useFirebase();
  return error;
};

// =====================================================
// 📋 TYPE-SAFE EXPORTS
// =====================================================

export default FirebaseProvider;

// Export types for external use
export type { FirebaseContextValue, FirebaseState, FirebaseProviderProps };
