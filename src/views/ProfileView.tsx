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
  Globe,
  Target,
  BookOpen,
  Award,
  Zap,
  TrendingUp,
  Heart,
  Star,
  Languages,
  Brain,
  Clock,
  Trophy,
  Flag,
  MapPin,
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              {/* Enhanced Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-xl">
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
                {/* Online Status */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
              </div>
              
              <div>
                <h1 className="text-4xl font-bold mb-2">Ciao, {formData.displayName || "Utente"}! 👋</h1>
                <p className="text-white/80 text-lg">Benvenuto nel tuo spazio personale di apprendimento</p>
                
                {/* Status Badges */}
                <div className="flex items-center gap-3 mt-4">
                  {role === "admin" && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-500/20 backdrop-blur-sm border border-purple-300/30 text-white">
                      <Shield className="w-4 h-4" />
                      Amministratore
                    </span>
                  )}
                  {(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 backdrop-blur-sm border border-green-300/30 text-white">
                      <CheckCircle className="w-4 h-4" />
                      Verificato
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 backdrop-blur-sm border border-blue-300/30 text-white">
                    <Globe className="w-4 h-4" />
                    {userProfile?.englishLevel || user?.englishLevel || "Principiante"}
                  </span>
                </div>
              </div>
            </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card className="h-full shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5" />
                  Informazioni personali
                </CardTitle>
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    size="sm"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
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
                      className="bg-green-500 hover:bg-green-600 text-white border-0"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salva
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      size="sm"
                      disabled={updateLoading}
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Annulla
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 flex-1 p-6">
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

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{formData.email}</span>
                    {(userProfile?.emailVerified || user?.emailVerified || authUser?.emailVerified) && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <Label className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Ruolo
                  </Label>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {isAdmin ? "Amministratore" : "Utente"}
                    </span>
                  </div>
                </div>

                {/* Registration Date */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data registrazione
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(userProfile?.createdAt || user?.createdAt)}</span>
                  </div>
                </div>

                {/* Last Login */}
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <Label className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Ultimo accesso
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{formatDate(userProfile?.lastLoginAt || user?.lastLoginAt)}</span>
                  </div>
                </div>

                {/* English Level */}
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <Label className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Livello inglese
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.englishLevel || user?.englishLevel || "Non specificato"}</span>
                  </div>
                </div>

                {/* Native Language */}
                <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                  <Label className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Lingua nativa
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.nativeLanguage || user?.nativeLanguage || "Non specificato"}</span>
                  </div>
                </div>

                {/* Target Language */}
                <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                  <Label className="text-sm font-medium text-teal-700 dark:text-teal-300 flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    Lingua di studio
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.targetLanguage || user?.targetLanguage || "Non specificato"}</span>
                  </div>
                </div>

                {/* Learning Goal */}
                <div className="p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                  <Label className="text-sm font-medium text-cyan-700 dark:text-cyan-300 flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Obiettivo di apprendimento
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.learningGoal || user?.learningGoal || "Non specificato"}</span>
                  </div>
                </div>

                {/* Daily Word Target */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Label className="text-sm font-medium text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Parole target giornaliere
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.dailyWordTarget || user?.dailyWordTarget || "Non specificato"}</span>
                  </div>
                </div>

                {/* Weekly Test Target */}
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                  <Label className="text-sm font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Test target settimanali
                  </Label>
                  <div className="mt-2">
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{userProfile?.weeklyTestTarget || user?.weeklyTestTarget || "Non specificato"}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {(userProfile?.bio || user?.bio) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Bio</Label>
                  <div className="mt-1">
                    <p className="text-gray-900 dark:text-gray-100">{userProfile?.bio || user?.bio}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="space-y-6">
          {/* Main Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{stats.testsCompleted}</div>
                <div className="text-sm text-white/80">Test completati</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{stats.studyDays}</div>
                <div className="text-sm text-white/80">Giorni di studio</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{stats.averageAccuracy}%</div>
                <div className="text-sm text-white/80">Accuratezza media</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{userProfile?.currentStreak || user?.currentStreak || 0}</div>
                <div className="text-sm text-white/80">Streak corrente</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Secondary Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{userProfile?.longestStreak || user?.longestStreak || 0}</div>
                <div className="text-sm text-white/80">Streak record</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-3 text-white/80" />
                <div className="text-3xl font-bold mb-1">{userProfile?.progressLevel || user?.progressLevel || 1}</div>
                <div className="text-sm text-white/80">Livello progresso</div>
              </CardContent>
            </Card>
          </div>

          {/* Next Milestone */}
          {(userProfile?.nextMilestone || user?.nextMilestone) && (
            <Card className="shadow-lg border-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Prossimo Traguardo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {(userProfile?.nextMilestone || user?.nextMilestone)?.icon || "🎯"}
                  </div>
                  <div className="text-xl font-bold mb-2 text-white">
                    {(userProfile?.nextMilestone || user?.nextMilestone)?.name || "Traguardo"}
                  </div>
                  <div className="text-sm text-white/80 mb-4">
                    {(userProfile?.nextMilestone || user?.nextMilestone)?.description || "Continua così!"}
                  </div>
                  <div className="w-full bg-white/30 rounded-full h-3 mb-2">
                    <div 
                      className="bg-white h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ 
                        width: `${Math.min(100, (((userProfile?.nextMilestone || user?.nextMilestone)?.progress || 0) / ((userProfile?.nextMilestone || user?.nextMilestone)?.target || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-sm text-white/90 font-medium">
                    {(userProfile?.nextMilestone || user?.nextMilestone)?.progress || 0} / {(userProfile?.nextMilestone || user?.nextMilestone)?.target || 1}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Attività recente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {testHistory && testHistory.length > 0 ? (
                <div className="space-y-4">
                  {testHistory.slice(-3).reverse().map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            Test {test.chapterStats && Object.keys(test.chapterStats).length > 0 ? `Cap. ${Object.keys(test.chapterStats)[0]}` : 'Generale'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(test.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-indigo-600">
                          {test.percentage || 0}%
                        </span>
                        <div className="text-xs text-gray-500">Punteggio</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">Nessuna attività recente</p>
                  <p className="text-gray-400 text-sm mt-1">Inizia il tuo primo test per vedere i progressi!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};