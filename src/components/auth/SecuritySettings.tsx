import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Shield,
  Smartphone,
  Key,
  Mail,
  CheckCircle,
  AlertCircle,
  Settings,
} from "lucide-react";
import { AuthenticatorWrapper } from "./AuthenticatorWrapper";
import { useAuth } from "../../hooks/integration/useAuth";

export const SecuritySettings: React.FC = () => {
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  const { user } = useAuth();

  const handleEnable2FA = () => {
    setShow2FASetup(true);
  };

  const handleDisable2FA = () => {
    // Qui chiameresti l'API per disabilitare 2FA
    setTwoFactorEnabled(false);
  };

  const handle2FAComplete = () => {
    setTwoFactorEnabled(true);
    setShow2FASetup(false);
  };

  const handleCancel2FA = () => {
    setShow2FASetup(false);
  };

  if (show2FASetup) {
    return (
      <AuthenticatorWrapper
        onComplete={handle2FAComplete}
        onCancel={handleCancel2FA}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">
          Impostazioni di Sicurezza
        </h2>
      </div>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <span>Autenticazione a Due Fattori</span>
            {twoFactorEnabled && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Proteggi il tuo account con un livello di sicurezza aggiuntivo usando
            Google Authenticator o app simili.
          </p>

          {twoFactorEnabled ? (
            <div className="space-y-3">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  L'autenticazione a due fattori è attiva e protegge il tuo account
                </AlertDescription>
              </Alert>

              <div className="flex space-x-3">
                <Button
                  onClick={handleDisable2FA}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Disabilita 2FA
                </Button>
                <Button
                  onClick={() => setShow2FASetup(true)}
                  variant="outline"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Riconfigura
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Il tuo account non è protetto da autenticazione a due fattori
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleEnable2FA}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Attiva 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" />
            <span>Password</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Mantieni la tua password sicura e aggiornata.
          </p>

          <div className="flex space-x-3">
            <Button variant="outline">
              Cambia Password
            </Button>
            <Button variant="outline">
              Cronologia Accessi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-green-600" />
            <span>Email di Sicurezza</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Email attuale: <span className="font-semibold">{user?.email}</span>
          </p>

          <div className="flex space-x-3">
            <Button variant="outline">
              Cambia Email
            </Button>
            <Button variant="outline">
              Invia Email di Verifica
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};