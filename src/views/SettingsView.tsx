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
  Sun,
  Moon,
  Mail,
  MessageSquare,
  Key,
  Sparkles,
  Zap,
  Star,
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
        
        try {
          const preferences = await getUserPreferences(user.id);
          if (preferences) {
            const isDark = preferences.theme === 'dark';
            setDarkMode(isDark);
            setEmailNotifications(preferences.notificationPreferences.emailEnabled);
            setStudyReminders(preferences.notificationPreferences.dailyReminder);
          } else {
            // Set default values if no preferences found
            setDarkMode(false);
            setEmailNotifications(true);
            setStudyReminders(true);
          }
        } catch (prefError) {
          // Always set defaults on error
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
        // Apply theme to DOM
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
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
          <p className="mt-4 text-gray-600 dark:text-gray-400">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Settings className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Impostazioni ⚙️</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">Personalizza la tua esperienza di apprendimento e configura le tue preferenze</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 relative -mt-16 z-10">

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Password & Security */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <Lock className="w-5 h-5" />
                Password e Sicurezza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(); }}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password attuale
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                        className="pr-10"
                        disabled={updateLoading}
                        autoComplete="current-password"
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
                    <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nuova password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                        className="pr-10"
                        disabled={updateLoading}
                        autoComplete="new-password"
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
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Conferma nuova password
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                        className="pr-10"
                        disabled={updateLoading}
                        autoComplete="new-password"
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
                    type="submit"
                    disabled={updateLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg"
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Aggiornamento...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Aggiorna Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5" />
                Preferenze
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Tema Interfaccia
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={!darkMode ? "default" : "outline"} 
                    size="sm" 
                    className={`flex items-center gap-2 justify-start p-4 h-auto ${!darkMode ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg' : 'border-2 border-gray-200 hover:border-blue-300'}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Chiaro</div>
                      <div className="text-xs opacity-80">Tema luminoso</div>
                    </div>
                  </Button>
                  <Button 
                    variant={darkMode ? "default" : "outline"} 
                    size="sm" 
                    className={`flex items-center gap-2 justify-start p-4 h-auto ${darkMode ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 shadow-lg' : 'border-2 border-gray-200 hover:border-purple-300'}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-medium">Scuro</div>
                      <div className="text-xs opacity-80">Tema notturno</div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Lingua Interfaccia
                </Label>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-200">Italiano</div>
                      <div className="text-sm text-green-600 dark:text-green-400">Lingua predefinita</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications full width */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-white">
              <Bell className="w-5 h-5" />
              Notifiche e Comunicazioni
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Notifiche Email</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Ricevi aggiornamenti via email</p>
                    </div>
                  </div>
                  <Button 
                    variant={emailNotifications ? "default" : "outline"}
                    size="sm"
                    className={emailNotifications ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg" : "border-blue-300 text-blue-700 hover:bg-blue-50"}
                    onClick={() => handleNotificationToggle('email')}
                  >
                    {emailNotifications ? (
                      <><CheckCircle className="w-4 h-4 mr-2" />Attive</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" />Attiva</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-purple-800 dark:text-purple-200">Promemoria Studio</p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Notifiche per sessioni di studio</p>
                    </div>
                  </div>
                  <Button 
                    variant={studyReminders ? "default" : "outline"}
                    size="sm"
                    className={studyReminders ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg" : "border-purple-300 text-purple-700 hover:bg-purple-50"}
                    onClick={() => handleNotificationToggle('study')}
                  >
                    {studyReminders ? (
                      <><CheckCircle className="w-4 h-4 mr-2" />Attivi</>
                    ) : (
                      <><Star className="w-4 h-4 mr-2" />Attiva</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};