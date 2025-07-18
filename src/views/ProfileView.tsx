import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  User,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  Edit2,
  Save,
  X,
  Camera,
  AlertCircle,
} from "lucide-react";
import { useAuth, useUserRole } from "../hooks/integration/useAuth";
import { useAppContext } from "../contexts/AppContext";
import { getUserStats } from "../services/authService";

export const ProfileView: React.FC = () => {
  const { user, userProfile, updateProfile, loading, authUser } = useAuth();
  const { role, isAdmin } = useUserRole();
  const { testHistory } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || user?.displayName || authUser?.displayName || "",
    email: userProfile?.email || user?.email || authUser?.email || "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Update form data when user data becomes available
  useEffect(() => {
    setFormData({
      displayName: userProfile?.displayName || user?.displayName || authUser?.displayName || "",
      email: userProfile?.email || user?.email || authUser?.email || "",
    });
  }, [userProfile, user, authUser]);
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: "error", text: "Seleziona un file immagine valido" });
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'immagine deve essere inferiore a 5MB" });
      return;
    }
    
    try {
      setUpdateLoading(true);
      setMessage(null);
      
      // Create a FileReader to convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        
        try {
          const success = await updateProfile({
            photoURL: base64String,
          });
          
          if (success) {
            setMessage({ type: "success", text: "Foto profilo aggiornata con successo!" });
          } else {
            setMessage({ type: "error", text: "Errore durante l'aggiornamento della foto" });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Errore durante l'aggiornamento della foto" });
        } finally {
          setUpdateLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      setMessage({ type: "error", text: "Errore durante il caricamento dell'immagine" });
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      setMessage({ type: "error", text: "Il nome non può essere vuoto" });
      return;
    }

    setUpdateLoading(true);
    setMessage(null);

    try {
      const success = await updateProfile({
        displayName: formData.displayName.trim(),
      });

      if (success) {
        setMessage({ type: "success", text: "Profilo aggiornato con successo!" });
        setIsEditing(false);
      } else {
        setMessage({ type: "error", text: "Errore durante l'aggiornamento del profilo" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Errore durante l'aggiornamento del profilo" });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: userProfile?.displayName || user?.displayName || authUser?.displayName || "",
      email: userProfile?.email || user?.email || authUser?.email || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Data non disponibile";
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const [stats, setStats] = useState({
    testsCompleted: 0,
    studyDays: 0,
    averageAccuracy: 0
  });

  // Load user stats from correct architecture
  useEffect(() => {
    const loadStats = async () => {
      if (!userProfile?.id) return;
      
      try {
        const userStats = await getUserStats(userProfile.id);
        if (userStats) {
          setStats({
            testsCompleted: userStats.totalTestsCompleted,
            studyDays: userStats.totalActiveDays,
            averageAccuracy: userStats.averageTestAccuracy
          });
        } else {
          // Fallback to testHistory if no stats found
          if (testHistory && testHistory.length > 0) {
            const totalTests = testHistory.length;
            const totalScore = testHistory.reduce((sum: number, test: any) => sum + (test.percentage || 0), 0);
            const averageAccuracy = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
            
            // Calculate study days (unique dates)
            const uniqueDates = new Set(
              testHistory.map((test: any) => new Date(test.timestamp).toDateString())
            );
            const studyDays = uniqueDates.size;

            setStats({
              testsCompleted: totalTests,
              studyDays: studyDays,
              averageAccuracy: averageAccuracy
            });
          }
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    
    loadStats();
  }, [userProfile?.id, testHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 dark:text-gray-500">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Il mio profilo</h1>
          <p className="text-gray-600 dark:text-gray-400 dark:text-gray-500">Gestisci le tue informazioni personali</p>
        </div>
        <div className="flex items-center gap-2">
          {role === "admin" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              <Shield className="w-4 h-4" />
              Amministratore
            </span>
          )}
          {(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              <CheckCircle className="w-4 h-4" />
              Email verificata
            </span>
          )}
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informazioni personali
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      size="sm"
                      disabled={updateLoading}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salva
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      disabled={updateLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annulla
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                  {(userProfile?.photoURL || user?.photoURL || authUser?.photoURL) ? (
                    <img 
                      src={(userProfile?.photoURL || user?.photoURL || authUser?.photoURL)!} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    formData.displayName.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Foto profilo</p>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={updateLoading}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-1"
                      disabled={updateLoading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {updateLoading ? "Caricamento..." : "Cambia foto"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="displayName" className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600">
                  Nome completo
                </Label>
                {isEditing ? (
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                    className="mt-1"
                    disabled={updateLoading}
                  />
                ) : (
                  <p className="mt-1 text-gray-900 dark:text-gray-100 dark:text-gray-100">{formData.displayName || "Non specificato"}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 dark:text-gray-300 dark:text-gray-600">Email</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-gray-100">{formData.email}</span>
                  {(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                {!(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
                  <p className="text-sm text-amber-600 mt-1">Email non verificata</p>
                )}
              </div>

              {/* Role */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Ruolo</Label>
                <div className="mt-1 flex items-center gap-2">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-purple-600" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600" />
                  )}
                  <span className="text-gray-900 dark:text-gray-100">
                    {isAdmin ? "Amministratore" : "Utente"}
                  </span>
                </div>
              </div>

              {/* Registration Date */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Data registrazione</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(userProfile?.createdAt || user?.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistiche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{stats.testsCompleted}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Test completati</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.studyDays}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Giorni di studio</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.averageAccuracy}%</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Accuratezza media</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attività recente</CardTitle>
            </CardHeader>
            <CardContent>
              {testHistory && testHistory.length > 0 ? (
                <div className="space-y-3">
                  {testHistory.slice(-3).reverse().map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Test {test.chapterStats && Object.keys(test.chapterStats).length > 0 ? `Cap. ${Object.keys(test.chapterStats)[0]}` : 'Generale'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            {formatDate(test.timestamp)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-indigo-600">
                        {test.percentage || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p>Nessuna attività recente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};