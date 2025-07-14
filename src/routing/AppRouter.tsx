import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { useAuth, useUserRole } from "../hooks/integration/useAuth";
import { MainView } from "../views/MainView";
import { TestView } from "../views/TestView";
import { ResultsView } from "../views/ResultsView";
import { StatsView } from "../views/StatsView";
import { AdminView } from "../views/AdminView";
import { AuthView } from "../views/AuthView";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export const AppRouter = () => {
  const { currentView, testMode, showResults } = useAppContext();
  const { isAuthenticated, isReady, loading, hasError, error } = useAuth();
  const { isAdmin } = useUserRole();

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

  // Loading state - solo se non ancora pronto
  if (!isReady || loading) {
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
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra AuthView
  if (!isAuthenticated) {
    return (
      <AuthView
        onAuthSuccess={() => {
          // Refresh della pagina per ricaricare lo stato dell'app
          window.location.reload();
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

    case "main":
    default:
      return (
        <ProtectedRoute requireAuth={true}>
          <MainView />
        </ProtectedRoute>
      );
  }
};
