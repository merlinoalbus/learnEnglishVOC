// components/auth/LoginForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/integration/useAuth";

interface LoginFormProps {
  onSwitchToSignUp?: () => void;
  onSwitchToForgotPassword?: () => void;
  onLoginSuccess?: () => void;
}

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignUp = () => {},
  onSwitchToForgotPassword = () => {},
  onLoginSuccess = () => {},
}) => {
  const {
    signIn,
    signInWithGoogle,
    isSigningIn,
    error: authError,
    clearError,
    validateEmail: authValidateEmail,
    isAuthenticated,
  } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [localError, setLocalError] = useState<string | null>(null);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated) {
      onLoginSuccess();
    }
  }, [isAuthenticated, onLoginSuccess]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const error = authError?.message || localError;

  const validateEmailLocal = (email: string): boolean => {
    return authValidateEmail(email);
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.email) {
      errors.email = "Email è richiesta";
    } else if (!validateEmailLocal(formData.email)) {
      errors.email = "Formato email non valido";
    }

    if (!formData.password) {
      errors.password = "Password è richiesta";
    } else if (formData.password.length < 6) {
      errors.password = "Password deve essere di almeno 6 caratteri";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }

    if (error) {
      setLocalError(null);
      clearError();
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const success = await signIn({
        email: formData.email,
        password: formData.password,
      });

      if (success) {
        // onLoginSuccess will be called by useEffect when isAuthenticated becomes true
      }
    } catch (error) {
      console.error("Login error:", error);
      setLocalError("Si è verificato un errore durante il login");
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      clearError();
      setLocalError(null);
      
      const success = await signInWithGoogle();
      
      if (success) {
        // onLoginSuccess will be called by useEffect when isAuthenticated becomes true
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      setLocalError("Si è verificato un errore con il login Google");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Auth Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="mario.rossi@example.com"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange("email", e.target.value)
            }
            className={`pl-10 h-12 rounded-xl border-2 transition-all duration-200 ${
              validationErrors.email
                ? "border-red-300 focus:border-red-500"
                : "border-gray-200 focus:border-blue-500"
            }`}
            disabled={isSigningIn}
          />
        </div>
        {validationErrors.email && (
          <p className="text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="La tua password"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange("password", e.target.value)
            }
            className={`pl-10 pr-12 h-12 rounded-xl border-2 transition-all duration-200 ${
              validationErrors.password
                ? "border-red-300 focus:border-red-500"
                : "border-gray-200 focus:border-blue-500"
            }`}
            disabled={isSigningIn}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 bg-transparent border-none cursor-pointer flex items-center justify-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isSigningIn}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
        {validationErrors.password && (
          <p className="text-sm text-red-600">{validationErrors.password}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange("rememberMe", e.target.checked)
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            disabled={isSigningIn}
          />
          <Label htmlFor="remember" className="text-sm text-gray-600">
            Ricordami
          </Label>
        </div>
        <button
          type="button"
          onClick={onSwitchToForgotPassword}
          className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto bg-transparent border-none cursor-pointer"
          disabled={isSigningIn}
        >
          Password dimenticata?
        </button>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Accesso in corso...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            Accedi
          </>
        )}
      </Button>

      {/* Divider */}
      <div className="relative">
        <Separator className="my-6" />
        <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-gray-500">
          oppure
        </span>
      </div>

      {/* Google Sign In */}
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full h-12 rounded-xl font-medium"
        disabled={isSigningIn}
      >
        {isSigningIn ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Accesso in corso...</span>
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Continua con Google</span>
          </>
        )}
      </Button>

      {/* Sign Up Link */}
      <div className="text-center">
        <span className="text-sm text-gray-600">Non hai un account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-semibold bg-transparent border-none cursor-pointer"
          disabled={isSigningIn}
        >
          Registrati ora
        </button>
      </div>
    </form>
  );
};
