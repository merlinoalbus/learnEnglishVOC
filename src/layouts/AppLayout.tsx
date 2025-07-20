import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../hooks/integration/useAuth";
import { getCurrentAuthUser } from "../services/authService";
import { AppHeader } from "../components/layout/AppHeader";
import { AppNavigation } from "../components/layout/AppNavigation";
import { Footer } from "../components/layout/Footer";
import { BackgroundParticles } from "../components/ui/BackgroundParticles";
import { NotificationToast } from "../components/ui/NotificationToast";
import { GlobalModals } from "../components/modals/GlobalModals";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { testMode, showResults } = useAppContext();
  const { isAuthenticated, user } = useAuth();
  
  // Accesso al global state che usa useAuth per la consistenza
  const globalAuthState = (window as any).globalAuthState || { lastUser: null };
  const effectiveUser = user || globalAuthState.lastUser;
  const effectiveAuthUser = effectiveUser ? getCurrentAuthUser() : null;
  const effectiveIsAuthenticated = isAuthenticated || (!!effectiveUser && !!effectiveAuthUser);
  
  // Force re-render quando global state cambia tramite eventi
  const [forceRender, setForceRender] = React.useState(0);
  React.useEffect(() => {
    const handleGlobalAuthChange = () => {
      setForceRender(prev => prev + 1);
    };
    
    window.addEventListener('globalAuthStateChanged', handleGlobalAuthChange);
    return () => window.removeEventListener('globalAuthStateChanged', handleGlobalAuthChange);
  }, []);
  
  
  // Force re-render quando user O effectiveUser cambia per sincronizzare con StrictMode
  const layoutKey = effectiveUser?.id || user?.id || 'no-user';

  return (
    <div key={layoutKey} className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900">
      {/* Background Particles sempre visibile */}
      <BackgroundParticles />

      {/* Notification Toast sempre visibile */}
      <NotificationToast />

      {/* Global Modals sempre disponibili */}
      <GlobalModals />

      {/* Header e Navigation sempre se autenticato */}
      {effectiveIsAuthenticated && (
        <>
          <div className="app-header-section">
            <div className="app-container-header">
              <AppHeader />
            </div>
          </div>

          <div className="app-navigation-section">
            <div className="app-container">
              <AppNavigation />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="app-main-section">
        <div
          className={`app-content-container ${
            effectiveIsAuthenticated && !testMode && !showResults ? "app-content-authenticated" : "app-content-default"
          }`}
        >
          <main>{children}</main>
        </div>
        
        {/* Footer */}
        {effectiveIsAuthenticated && (
          <Footer className="mt-auto" />
        )}
      </div>
    </div>
  );
};
