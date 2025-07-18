import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { useFirebase } from "../contexts/FirebaseContext";
import { useAuth, useUserRole } from "../hooks/integration/useAuth";
import { MainView } from "../views/MainView";
import { TestView } from "../views/TestView";
import { ResultsView } from "../views/ResultsView";
import { StatsView } from "../views/StatsView";
import { AdminView } from "../views/AdminView";
import { AuthView } from "../views/AuthView";
import { ProfileView } from "../views/ProfileView";
import { SettingsView } from "../views/SettingsView";
import { TermsOfServiceView } from "../views/TermsOfServiceView";
import { PrivacyPolicyView } from "../views/PrivacyPolicyView";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export const AppRouter = () => {
  const { currentView, testMode, showResults, dispatch } = useAppContext();
  const { isAuthenticated, isReady, loading, hasError, error, user, authUser } = useAuth();
  const { isAdmin } = useUserRole();
  
  // Calcolo diretto che funzionava
  const directIsAuthenticated = !!user && !!authUser;
  
  
  // Force re-render per login
  const [renderKey, setRenderKey] = React.useState(0);
  
  // Force main view after login - REMOVED to allow navigation to profile/settings
  
  // Rimuovo forceUpdate che causava loop infinito

  // Controllo stato Firebase
  const { isReady: firebaseContextReady } = useFirebase();

  // Hook per timeout message (deve essere sempre chiamato)
  const [showTimeoutMessage, setShowTimeoutMessage] = React.useState(false);
  
  React.useEffect(() => {
    if (!isReady) {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 5000);
      
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutMessage(false);
      return undefined; // Explicit return for all code paths
    }
  }, [isReady]);

  // Se c'è un errore Firebase critico, mostra errore
  if (hasError && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Errore di Inizializzazione
          </h2>
          <p className="text-gray-700 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Ricarica Pagina
          </button>
        </div>
      </div>
    );
  }

  // Loading state - solo se Firebase non è ancora pronto E firebaseContext non è pronto
  if (!firebaseContextReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-700">
            Inizializzazione app...
          </h2>
          <p className="text-sm text-gray-500">
            Configurazione sicurezza e database
          </p>
          {showTimeoutMessage && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-700">
                Se l'inizializzazione impiega troppo tempo, prova a ricaricare la pagina
              </p>
              <div className="mt-2 space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                >
                  Ricarica
                </button>
                <button
                  onClick={() => {
                    if ((window as any).__resetAuthState) {
                      (window as any).__resetAuthState();
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                >
                  Reset Auth
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Allow access to terms and privacy without authentication
  if (currentView === "terms") {
    return <TermsOfServiceView />;
  }

  if (currentView === "privacy") {
    return <PrivacyPolicyView />;
  }

  // Se l'utente non è autenticato, mostra AuthView
  if (!directIsAuthenticated) {
    return (
      <AuthView
        onAuthSuccess={() => {
          // Reset view to main after successful login
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('resetToMainView'));
            setRenderKey(prev => prev + 1);
          }, 100);
        }}
      />
    );
  }

  // Se siamo in modalità test, mostra TestView (protetta)
  if (testMode) {
    return (
      <ProtectedRoute requireAuth={true}>
        <TestView />
      </ProtectedRoute>
    );
  }

  // Se stiamo mostrando i risultati, mostra ResultsView (protetta)
  if (showResults) {
    return (
      <ProtectedRoute requireAuth={true}>
        <ResultsView />
      </ProtectedRoute>
    );
  }

  // Routing principale basato su currentView
  switch (currentView) {
    case "admin":
      return (
        <ProtectedRoute requireAuth={true} requiredRole="admin">
          <AdminView />
        </ProtectedRoute>
      );

    case "stats":
      return (
        <ProtectedRoute requireAuth={true}>
          <StatsView />
        </ProtectedRoute>
      );

    case "profile":
      return (
        <ProtectedRoute requireAuth={true}>
          <ProfileView />
        </ProtectedRoute>
      );

    case "settings":
      return (
        <ProtectedRoute requireAuth={true}>
          <SettingsView />
        </ProtectedRoute>
      );


    case "main":
    default:
      return (
        <ProtectedRoute requireAuth={true}>
          <MainView />
        </ProtectedRoute>
      );
  }
};
