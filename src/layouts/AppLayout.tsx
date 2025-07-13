import React from "react";
import { useAppContext } from "../contexts/AppContext";
import { useAuth } from "../hooks/integration/useAuth";
import { AppHeader } from "../components/layout/AppHeader";
import { AppNavigation } from "../components/layout/AppNavigation";
import { BackgroundParticles } from "../components/ui/BackgroundParticles";
import { NotificationToast } from "../components/ui/NotificationToast";
import { GlobalModals } from "../components/modals/GlobalModals";

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { testMode, showResults } = useAppContext();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Background Particles sempre visibile */}
      <BackgroundParticles />

      {/* Notification Toast sempre visibile */}
      <NotificationToast />

      {/* Global Modals sempre disponibili */}
      <GlobalModals />

      {/* Header e Navigation solo se autenticato e non in modalità test/risultati */}
      {isAuthenticated && !testMode && !showResults && (
        <>
          <div className="relative z-10 pb-8">
            <div className="max-width-7xl mx-auto px-4 pt-8">
              <AppHeader />
            </div>
          </div>

          <div className="relative z-10 pb-8">
            <div className="max-w-7xl mx-auto px-4">
              <AppNavigation />
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="relative z-10">
        <div
          className={`max-w-7xl mx-auto px-4 ${
            isAuthenticated && !testMode && !showResults ? "pt-4" : "pt-8"
          }`}
        >
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};
