import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Checkbox } from "../ui/checkbox";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  UserPlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react";
// FIXED: Corrected import path to hooks/integration/useAuth
import { useAuth } from "../../hooks/integration/useAuth";
import { useAppContext } from "../../contexts/AppContext";
import { Alert, AlertDescription } from "../ui/alert";

interface SignUpFormProps {
  onSwitchToLogin: () => void;
  onSignUpSuccess?: () => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  terms?: string;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  onSwitchToLogin,
  onSignUpSuccess = () => {},
}) => {
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const {
    signUp,
    isSigningUp,
    error: authError,
    clearError,
    validateEmail,
    validatePassword,
  } = useAuth();

  // Validation functions
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (!formData.email) {
      errors.email = "Email è richiesta";
    } else if (!validateEmail(formData.email)) {
      errors.email = "Formato email non valido";
    }

    if (!formData.password) {
      errors.password = "Password è richiesta";
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password deve contenere almeno 8 caratteri";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Conferma password è richiesta";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Le password non corrispondono";
    }

    if (!formData.displayName.trim()) {
      errors.displayName = "Nome è richiesto";
    }

    if (!formData.acceptTerms) {
      errors.terms = "Devi accettare i termini di servizio";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear auth error when user starts typing
    if (authError || error) {
      clearError();
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        acceptTerms: formData.acceptTerms,
      });

      if (success) {
        onSignUpSuccess();
      }
    } catch (err) {
      setError("Errore durante la registrazione");
      console.error("Sign up error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentError = authError?.message || error;
  const currentLoading = isSigningUp || isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Crea il tuo account
        </h2>
        <p className="text-gray-600">
          Unisciti a migliaia di studenti che stanno migliorando il loro inglese
        </p>
      </div>

      {/* Error Display */}
      {currentError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {currentError}
          </AlertDescription>
        </Alert>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Display Name */}
        <div className="space-y-2">
          <Label
            htmlFor="displayName"
            className="text-sm font-medium text-gray-700"
          >
            Nome completo
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="displayName"
              type="text"
              placeholder="Il tuo nome completo"
              value={formData.displayName}
              onChange={(e) => handleInputChange("displayName", e.target.value)}
              className={`pl-10 ${
                validationErrors.displayName
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              required
              disabled={currentLoading}
            />
          </div>
          {validationErrors.displayName && (
            <p className="text-sm text-red-600">
              {validationErrors.displayName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Indirizzo Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="email"
              type="email"
              placeholder="tua.email@esempio.com"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`pl-10 ${
                validationErrors.email
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              required
              disabled={currentLoading}
            />
          </div>
          {validationErrors.email && (
            <p className="text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-sm font-medium text-gray-700"
          >
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Crea una password sicura"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`pl-10 pr-10 ${
                validationErrors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              required
              disabled={currentLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={currentLoading}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-sm text-red-600">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-gray-700"
          >
            Conferma Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Ripeti la password"
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className={`pl-10 pr-10 ${
                validationErrors.confirmPassword
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              required
              disabled={currentLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={currentLoading}
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-sm text-red-600">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>
      </div>

      {/* Terms and Privacy */}
      <div className="space-y-3">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={formData.acceptTerms}
            onCheckedChange={(checked: boolean) =>
              handleInputChange("acceptTerms", checked)
            }
            className="mt-1"
            disabled={currentLoading}
          />
          <div className="space-y-1">
            <Label
              htmlFor="terms"
              className="text-sm text-gray-700 cursor-pointer"
            >
              Accetto i{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch({ type: "SET_VIEW", payload: "terms" });
                }}
              >
                Termini di Servizio
              </button>{" "}
              e la{" "}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  dispatch({ type: "SET_VIEW", payload: "privacy" });
                }}
              >
                Privacy Policy
              </button>
            </Label>
            {validationErrors.terms && (
              <p className="text-sm text-red-600">{validationErrors.terms}</p>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="privacy"
            checked={formData.acceptPrivacy}
            onCheckedChange={(checked: boolean) =>
              handleInputChange("acceptPrivacy", checked)
            }
            className="mt-1"
            disabled={currentLoading}
          />
          <Label
            htmlFor="privacy"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Voglio ricevere aggiornamenti via email su nuove funzionalità e
            contenuti
          </Label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={currentLoading}
      >
        {currentLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creazione account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Crea Account
          </>
        )}
      </Button>

      {/* Login Link */}
      <div className="text-center">
        <span className="text-sm text-gray-600">Hai già un account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-purple-600 hover:text-purple-800 p-0 h-auto font-semibold bg-transparent border-none cursor-pointer"
          disabled={currentLoading}
        >
          Accedi ora
        </button>
      </div>
    </form>
  );
};
