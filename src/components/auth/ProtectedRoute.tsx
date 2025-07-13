import React from "react";
import { useAuth, useUserRole } from "../../hooks/integration/useAuth";
import { AuthView } from "../../views/AuthView";
import { UserRole } from "../../types/entities/User.types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle, Loader2, Shield } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  fallback,
}) => {
  const { isAuthenticated, isReady, loading } = useAuth();
  const { role, userProfile } = useUserRole();

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-96 text-center">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              Caricamento...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Verifica autenticazione in corso...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!requireAuth) {
    return <>{children}</>;
  }

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <AuthView onAuthSuccess={() => window.location.reload()} />;
  }

  if (isAuthenticated && userProfile && !userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Card className="w-96 text-center border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              Account Disabilitato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Il tuo account è stato temporaneamente disabilitato.
            </p>
            <p className="text-sm text-gray-500">
              Contatta l'amministratore per maggiori informazioni.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAuthenticated && userProfile && !userProfile.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <Card className="w-96 text-center border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-yellow-600">
              <AlertTriangle className="w-6 h-6" />
              Email Non Verificata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Devi verificare la tua email prima di accedere all'applicazione.
            </p>
            <p className="text-sm text-gray-500">
              Controlla la tua casella email e clicca sul link di verifica.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requiredRole && role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <Card className="w-96 text-center border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-red-600">
              <Shield className="w-6 h-6" />
              Accesso Negato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Non hai i permessi necessari per accedere a questa sezione.
            </p>
            <p className="text-sm text-gray-500">
              Ruolo richiesto:{" "}
              <span className="font-semibold">{requiredRole}</span>
            </p>
            <p className="text-sm text-gray-500">
              Il tuo ruolo:{" "}
              <span className="font-semibold">{role || "Non definito"}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>;
};

export const UserRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <ProtectedRoute requireAuth={true}>{children}</ProtectedRoute>;
};
