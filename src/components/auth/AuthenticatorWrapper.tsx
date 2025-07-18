import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Shield,
  Smartphone,
  QrCode,
  Key,
  Copy,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../hooks/integration/useAuth";

interface AuthenticatorWrapperProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

type AuthenticatorStep = 
  | "setup-start"
  | "show-qr"
  | "verify-code"
  | "setup-complete"
  | "verify-login";

export const AuthenticatorWrapper: React.FC<AuthenticatorWrapperProps> = ({
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<AuthenticatorStep>("setup-start");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secretKey, setSecretKey] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(true);

  const { user } = useAuth();

  // Simula la generazione del QR code (in realtà useresti una libreria)
  const generateQRCode = async () => {
    setLoading(true);
    try {
      // Qui useresti una libreria come 'qrcode' per generare il QR
      const secret = generateSecretKey();
      const appName = "Learn English VOC";
      const userEmail = user?.email || "user@example.com";
      
      // URL standard per Google Authenticator
      const otpUrl = `otpauth://totp/${appName}:${userEmail}?secret=${secret}&issuer=${appName}`;
      
      setSecretKey(secret);
      setQrCodeUrl(otpUrl);
      setCurrentStep("show-qr");
    } catch (err) {
      setError("Errore nella generazione del codice QR");
    } finally {
      setLoading(false);
    }
  };

  const generateSecretKey = (): string => {
    // Genera un secret key base32 (in realtà useresti una libreria appropriata)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const copySecretKey = () => {
    navigator.clipboard.writeText(secretKey);
    // Potresti aggiungere un toast di conferma
  };

  const verifyAuthenticatorCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Il codice deve essere di 6 cifre");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Qui chiameresti la tua API per verificare il codice TOTP
      const isValid = await verifyTOTPCode(verificationCode, secretKey);
      
      if (isValid) {
        if (isSetupMode) {
          setCurrentStep("setup-complete");
        } else {
          onComplete?.();
        }
      } else {
        setError("Codice non valido. Riprova.");
      }
    } catch (err) {
      setError("Errore nella verifica del codice");
    } finally {
      setLoading(false);
    }
  };

  // Simula la verifica del codice TOTP (in realtà useresti una libreria server-side)
  const verifyTOTPCode = async (code: string, secret: string): Promise<boolean> => {
    // Qui implementeresti la verifica TOTP reale
    // Per ora simula sempre successo se il codice è "123456"
    return code === "123456";
  };

  const renderSetupStart = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Shield className="w-8 h-8 text-blue-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Configura Autenticazione a Due Fattori
        </h2>
        <p className="text-gray-600">
          Aumenta la sicurezza del tuo account con Google Authenticator
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-left">
            <p className="font-medium text-blue-900">Prima di iniziare:</p>
            <p className="text-sm text-blue-800">
              Assicurati di aver installato Google Authenticator sul tuo telefono
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={generateQRCode}
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generazione...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4 mr-2" />
              Inizia Configurazione
            </>
          )}
        </Button>

        <Button
          onClick={onCancel}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Annulla
        </Button>
      </div>
    </div>
  );

  const renderQRCode = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <QrCode className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Scansiona il Codice QR
        </h2>
        <p className="text-gray-600">
          Apri Google Authenticator e scansiona questo codice
        </p>
      </div>

      {/* QR Code placeholder - in realtà useresti una libreria per generarlo */}
      <div className="bg-gray-100 p-8 rounded-lg">
        <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
          <QrCode className="w-24 h-24 text-gray-400" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          Non riesci a scansionare? Inserisci manualmente:
        </p>
        <div className="flex items-center space-x-2">
          <code className="bg-white px-3 py-1 rounded text-sm font-mono">
            {secretKey}
          </code>
          <Button
            onClick={copySecretKey}
            variant="outline"
            size="sm"
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Button
        onClick={() => setCurrentStep("verify-code")}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Smartphone className="w-4 h-4 mr-2" />
        Ho configurato l'app
      </Button>
    </div>
  );

  const renderVerifyCode = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
        <Key className="w-8 h-8 text-purple-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Verifica il Codice
        </h2>
        <p className="text-gray-600">
          Inserisci il codice a 6 cifre mostrato nell'app
        </p>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="code" className="text-sm font-medium text-gray-700">
            Codice Authenticator
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="123456"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className="text-center text-lg tracking-wider"
            maxLength={6}
            disabled={loading}
          />
        </div>

        <Button
          onClick={verifyAuthenticatorCode}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={loading || verificationCode.length !== 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifica...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Verifica Codice
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderSetupComplete = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Configurazione Completata!
        </h2>
        <p className="text-gray-600">
          L'autenticazione a due fattori è ora attiva sul tuo account
        </p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="text-left">
            <p className="font-medium text-green-900">Il tuo account è più sicuro</p>
            <p className="text-sm text-green-800">
              Da ora in poi ti verrà chiesto il codice dell'app ad ogni accesso
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onComplete}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        Continua
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        {currentStep === "setup-start" && renderSetupStart()}
        {currentStep === "show-qr" && renderQRCode()}
        {currentStep === "verify-code" && renderVerifyCode()}
        {currentStep === "setup-complete" && renderSetupComplete()}
      </div>
    </div>
  );
};