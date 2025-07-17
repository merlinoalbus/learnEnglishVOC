import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Settings,
  Lock,
  Shield,
  Bell,
  Palette,
  Globe,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth, useUserRole } from "../hooks/integration/useAuth";
import { 
  getUserPreferences, 
  updateUserTheme, 
  updateNotificationPreferences 
} from "../services/authService";

export const SettingsView: React.FC = () => {
  const { user, userProfile, updatePassword, loading } = useAuth();
  const { isAdmin } = useUserRole();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [studyReminders, setStudyReminders] = useState(true);
  
  // Load user preferences from correct architecture
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.id) return;
      
      try {
        setPreferencesLoading(true);
        
        const preferences = await getUserPreferences(user.id);
        if (preferences) {
          setDarkMode(preferences.theme === 'dark');
          setEmailNotifications(preferences.notificationPreferences.emailEnabled);
          setStudyReminders(preferences.notificationPreferences.dailyReminder);
        } else {
          // Set default values if no preferences found
          console.log("No preferences found, using defaults");
          setDarkMode(false);
          setEmailNotifications(true);
          setStudyReminders(true);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        setMessage({ type: "error", text: "Errore nel caricamento delle preferenze" });
      } finally {
        setPreferencesLoading(false);
      }
    };
    
    loadPreferences();
  }, [user?.id]);
  
  const handleThemeChange = async (theme: 'light' | 'dark') => {
    if (!user?.id) return;
    
    try {
      const success = await updateUserTheme(user.id, theme);
      if (success) {
        setDarkMode(theme === 'dark');
        setMessage({ type: "success", text: `Tema ${theme === 'dark' ? 'scuro' : 'chiaro'} attivato` });
      } else {
        setMessage({ type: "error", text: "Errore nell'aggiornamento del tema" });
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      setMessage({ type: "error", text: "Errore nell'aggiornamento del tema" });
    }
  };
  
  const handleNotificationToggle = async (type: 'email' | 'study') => {
    if (!user?.id) return;
    
    try {
      let success = false;
      
      if (type === 'email') {
        success = await updateNotificationPreferences(user.id, {
          emailEnabled: !emailNotifications
        });
        if (success) {
          setEmailNotifications(!emailNotifications);
          setMessage({ type: "success", text: `Notifiche email ${!emailNotifications ? 'attivate' : 'disattivate'}` });
        }
      } else {
        success = await updateNotificationPreferences(user.id, {
          dailyReminder: !studyReminders
        });
        if (success) {
          setStudyReminders(!studyReminders);
          setMessage({ type: "success", text: `Promemoria studio ${!studyReminders ? 'attivati' : 'disattivati'}` });
        }
      }
      
      if (!success) {
        setMessage({ type: "error", text: "Errore nell'aggiornamento delle notifiche" });
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      setMessage({ type: "error", text: "Errore nell'aggiornamento delle notifiche" });
    }
  };
  
  const handleDeleteAccount = () => {
    setMessage({ type: "error", text: "Funzione eliminazione account non ancora implementata" });
  };
  
  const handleTestAdminToggle = () => {
    setMessage({ type: "success", text: "Funzione test admin - ricarica la pagina per vedere il pannello admin nella navigazione" });
  };

  const handlePasswordChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleUpdatePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Tutti i campi sono obbligatori" });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "Le nuove password non corrispondono" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: "error", text: "La nuova password deve contenere almeno 6 caratteri" });
      return;
    }

    setUpdateLoading(true);
    setMessage(null);

    try {
      const success = await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (success) {
        setMessage({ type: "success", text: "Password aggiornata con successo!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setMessage({ type: "error", text: "Errore durante l'aggiornamento della password" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Errore durante l'aggiornamento della password" });
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-gray-600">Configura le tue preferenze e sicurezza</p>
      </div>

      {/* Message */}
      {message && (
        <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Password e Sicurezza
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Password attuale
              </Label>
              <div className="relative mt-1">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                  className="pr-10"
                  disabled={updateLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Nuova password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwordForm.newPassword}
                  onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                  className="pr-10"
                  disabled={updateLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Conferma nuova password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                  className="pr-10"
                  disabled={updateLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              onClick={handleUpdatePassword}
              disabled={updateLoading}
              className="w-full"
            >
              {updateLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Aggiorna Password
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Preferenze
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Tema</Label>
              <div className="mt-2 flex items-center gap-4">
                <Button 
                  variant={!darkMode ? "outline" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => handleThemeChange('light')}
                >
                  <Palette className="w-4 h-4" />
                  Chiaro
                </Button>
                <Button 
                  variant={darkMode ? "outline" : "ghost"} 
                  size="sm" 
                  className="flex items-center gap-2"
                  onClick={() => handleThemeChange('dark')}
                >
                  <Palette className="w-4 h-4" />
                  Scuro
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">Lingua</Label>
              <div className="mt-2">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Italiano
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifiche
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Notifiche email</p>
                <p className="text-xs text-gray-500">Ricevi aggiornamenti via email</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNotificationToggle('email')}
              >
                {emailNotifications ? 'Disattiva' : 'Attiva'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Promemoria studio</p>
                <p className="text-xs text-gray-500">Notifiche per sessioni di studio</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNotificationToggle('study')}
              >
                {studyReminders ? 'Disattiva' : 'Attiva'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools */}
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Settings className="w-5 h-5" />
              Strumenti Sviluppatore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isAdmin && (
              <div>
                <p className="text-sm text-gray-700 mb-2">Test funzionalità admin</p>
                <p className="text-xs text-gray-500 mb-4">
                  Attiva temporaneamente i permessi admin per testare le funzionalità (solo per sviluppo)
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleTestAdminToggle}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Test Admin Mode
                </Button>
              </div>
            )}
            {isAdmin && (
              <div>
                <p className="text-sm text-gray-700 mb-2">Pannello Amministratore</p>
                <p className="text-xs text-gray-500 mb-4">
                  Hai accesso al pannello admin nella navigazione principale
                </p>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  <Shield className="w-3 h-3" />
                  Amministratore
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              Zona Pericolosa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 mb-2">Elimina account</p>
              <p className="text-xs text-gray-500 mb-4">
                Questa azione eliminerà permanentemente il tuo account e tutti i dati associati.
              </p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Elimina Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};