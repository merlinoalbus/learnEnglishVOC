import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Mail,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../hooks/integration/useAuth";
import { Alert, AlertDescription } from "../ui/alert";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [validationError, setValidationError] = useState("");

  const {
    resetPassword,
    isResettingPassword,
    error: authError,
    clearError,
    validateEmail,
  } = useAuth();

  const validateForm = (): boolean => {
    if (!email) {
      setValidationError("Email è richiesta");
      return false;
    }

    if (!validateEmail(email)) {
      setValidationError("Formato email non valido");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handleInputChange = (value: string) => {
    setEmail(value);
    if (validationError) {
      setValidationError("");
    }
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const success = await resetPassword({ email });
      if (success) {
        setEmailSent(true);
      }
    } catch (error) {
      console.error("Password reset error:", error);
    }
  };

  // Success state after email sent
  if (emailSent) {
    return (
      <div className="text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Email inviata!
          </h3>
          <p className="text-gray-600 mb-4">
            Abbiamo inviato le istruzioni per reimpostare la password a:
          </p>
          <p className="font-semibold text-gray-800 mb-4">{email}</p>
          <p className="text-sm text-gray-500">
            Controlla la tua email e segui le istruzioni per creare una nuova
            password.
          </p>
        </div>

        <Alert>
          <Mail className="h-4 w-4" />
          <AlertDescription>
            Non hai ricevuto l'email? Controlla la cartella spam o riprova tra
            qualche minuto.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button
            onClick={() => setEmailSent(false)}
            variant="outline"
            className="w-full"
          >
            Invia di nuovo
          </Button>

          <Button onClick={onSwitchToLogin} variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna al Login
          </Button>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Password dimenticata?
        </h2>
        <p className="text-gray-600">
          Inserisci la tua email e ti invieremo le istruzioni per reimpostare la
          password.
        </p>
      </div>

      {/* Error Messages */}
      {authError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {authError.message || "Errore durante l'invio dell'email di reset."}
          </AlertDescription>
        </Alert>
      )}

      {validationError && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* Email Input */}
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
            value={email}
            onChange={(e) => handleInputChange(e.target.value)}
            className="pl-10"
            required
            disabled={isResettingPassword}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        disabled={isResettingPassword}
      >
        {isResettingPassword ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Invia istruzioni
          </>
        )}
      </Button>

      {/* Back to Login */}
      <div className="text-center">
        <Button
          type="button"
          onClick={onSwitchToLogin}
          variant="ghost"
          className="text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna al Login
        </Button>
      </div>
    </form>
  );
};
