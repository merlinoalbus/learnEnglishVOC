import React, { useEffect } from "react";
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
  const authState = useAuth();
  const { isAdmin } = useUserRole();

  // Debug logging per capire lo stato
  useEffect(() => {
    console.log("🔍 [AppRouter] Auth State Debug:", {
      isAuthenticated: authState.isAuthenticated,
      isReady: authState.isReady,
      loading: authState.loading,
      initializing: authState.initializing,
      hasError: authState.hasError,
      error: authState.error,
      user: authState.user,
      authUser: authState.authUser,
    });
  }, [authState]);

  // Se c'è un errore Firebase critico, mostra errore
  if (authState.hasError && authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Errore di Inizializzazione
          </h2>
          <p className="text-gray-700 mb-4">{authState.error.message}</p>
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

  // Loading state semplificato - mostra solo se initializing O se non isReady
  if (authState.initializing || !authState.isReady) {
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

          {/* Debug info */}
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
            <div>isReady: {String(authState.isReady)}</div>
            <div>initializing: {String(authState.initializing)}</div>
            <div>loading: {String(authState.loading)}</div>
            <div>isAuthenticated: {String(authState.isAuthenticated)}</div>
          </div>
        </div>
      </div>
    );
  }

  // Se l'utente non è autenticato, mostra AuthView
  if (!authState.isAuthenticated) {
    return (
      <AuthView
        onAuthSuccess={() => {
          console.log("🔍 [AppRouter] Auth success, reloading...");
          window.location.reload();
        }}
      />
    );
  }

  // Se siamo in modalità test, mostra TestView (protetta)
  if (testMode) {
    return <TestView />;
  }

  // Se stiamo mostrando i risultati, mostra ResultsView (protetta)
  if (showResults) {
    return <ResultsView />;
  }

  // Routing principale basato su currentView
  switch (currentView) {
    case "admin":
      if (!isAdmin) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600">Accesso Negato</h2>
              <p className="text-gray-600">
                Non hai i permessi per accedere al pannello admin.
              </p>
            </div>
          </div>
        );
      }
      return <AdminView />;

    case "stats":
      return <StatsView />;

    case "main":
    default:
      return <MainView />;
  }
};
