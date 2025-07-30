import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../hooks/integration/useAuth";

interface AuthActionHandlerProps {
  mode: string;
  oobCode: string;
  apiKey: string;
  onComplete?: () => void;
}

export const AuthActionHandler: React.FC<AuthActionHandlerProps> = ({
  mode,
  oobCode,
  apiKey,
  onComplete,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string>("");

  const { confirmPasswordReset, verifyPasswordResetCode, verifyEmail } = useAuth();

  useEffect(() => {
    handleAction();
  }, [mode, oobCode]);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      switch (mode) {
        case "resetPassword":
          // Verifica il codice e ottieni l'email
          if (!verifyPasswordResetCode) {
            throw new Error("Funzione di verifica non disponibile");
          }
          const userEmail = await verifyPasswordResetCode(oobCode);
          setEmail(userEmail);
          setLoading(false);
          break;

        case "verifyEmail":
          // Verifica l'email
          if (!verifyEmail) {
            throw new Error("Funzione di verifica email non disponibile");
          }
          await verifyEmail(oobCode);
          setSuccess(true);
          setLoading(false);
          break;

        default:
          throw new Error("Modalità non supportata");
      }
    } catch (err: any) {
      setError(err.message || "Errore durante l'elaborazione dell'azione");
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    if (newPassword.length < 6) {
      setError("La password deve contenere almeno 6 caratteri");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!confirmPasswordReset) {
        throw new Error("Funzione di reset password non disponibile");
      }
      await confirmPasswordReset(oobCode, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Errore durante il reset della password");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="auth-page-background">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Verifica in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page-background">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {mode === "resetPassword" ? "Password aggiornata!" : "Email verificata!"}
            </h2>
            <p className="text-gray-600 mb-6">
              {mode === "resetPassword"
                ? "La tua password è stata aggiornata con successo."
                : "Il tuo indirizzo email è stato verificato con successo."}
            </p>
            <Button
              onClick={onComplete}
              className="auth-button-action"
            >
              Continua
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-page-background">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Errore
            </h2>
            <Alert className="border-red-200 bg-red-50 mb-6">
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
            <Button
              onClick={onComplete}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna all'app
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Form per reset password
  if (mode === "resetPassword") {
    return (
      <div className="auth-page-background">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nuova Password
            </h2>
            <p className="text-gray-600">
              Inserisci la nuova password per {email}
            </p>
          </div>

          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Nuova Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Inserisci la nuova password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Conferma Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Conferma la nuova password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="auth-button-action"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                "Aggiorna Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};