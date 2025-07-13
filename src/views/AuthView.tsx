import React, { useState, useEffect } from "react";
import { AuthLayout } from "../layouts/AuthLayout";
import { LoginForm } from "../components/auth/LoginForm";
import { SignUpForm } from "../components/auth/SignUpForm";
import { ForgotPasswordForm } from "../components/auth/ForgotPasswordForm";
import { useAuth } from "../hooks/integration/useAuth";

type AuthMode = "login" | "signup" | "forgot-password";

interface AuthViewProps {
  onAuthSuccess?: () => void;
  initialMode?: AuthMode;
}

interface AuthConfig {
  title: string;
  subtitle: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onAuthSuccess,
  initialMode = "login",
}) => {
  const [currentMode, setCurrentMode] = useState<AuthMode>(initialMode);
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      onAuthSuccess?.();
    }
  }, [isReady, isAuthenticated, onAuthSuccess]);

  const getAuthConfig = (mode: AuthMode): AuthConfig => {
    switch (mode) {
      case "login":
        return {
          title: "Bentornato!",
          subtitle:
            "Accedi al tuo account per continuare il tuo percorso di apprendimento",
        };
      case "signup":
        return {
          title: "Inizia ora!",
          subtitle: "Crea il tuo account e inizia a migliorare il tuo inglese",
        };
      case "forgot-password":
        return {
          title: "Recupera password",
          subtitle:
            "Ti invieremo le istruzioni per reimpostare la tua password",
        };
      default:
        return getAuthConfig("login");
    }
  };

  const config = getAuthConfig(currentMode);

  const renderAuthForm = () => {
    switch (currentMode) {
      case "login":
        return (
          <LoginForm
            onSwitchToSignUp={() => setCurrentMode("signup")}
            onSwitchToForgotPassword={() => setCurrentMode("forgot-password")}
            onLoginSuccess={onAuthSuccess}
          />
        );
      case "signup":
        return (
          <SignUpForm
            onSwitchToLogin={() => setCurrentMode("login")}
            onSignUpSuccess={onAuthSuccess}
          />
        );
      case "forgot-password":
        return (
          <ForgotPasswordForm onSwitchToLogin={() => setCurrentMode("login")} />
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout title={config.title} subtitle={config.subtitle}>
      {renderAuthForm()}
    </AuthLayout>
  );
};
