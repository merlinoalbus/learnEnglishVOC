// src/components/auth/AuthView.js
import React, { useState } from 'react';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';

export const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  
  const { signIn, signUp, signInWithGoogle, resetPassword, loading, error, clearError } = useFirebaseAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(formData.email, formData.password, formData.displayName);
      }
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    try {
      await signInWithGoogle();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      alert('Inserisci la tua email prima di richiedere il reset password');
      return;
    }
    
    try {
      await resetPassword(formData.email);
      alert('Email di reset password inviata! Controlla la tua casella di posta.');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    clearError();
    setFormData({ email: '', password: '', displayName: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* App Header */}
        <div className="text-center space-y-2">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            🧠
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vocabulary Master
          </h1>
          <p className="text-gray-600">
            La tua app intelligente per imparare l'inglese
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
            <h2 className="text-center text-xl flex items-center justify-center gap-3">
              {isLogin ? (
                <>
                  🔑 Accedi al tuo account
                </>
              ) : (
                <>
                  ✨ Crea un nuovo account
                </>
              )}
            </h2>
            <p className="text-center text-blue-100 text-sm mt-2">
              {isLogin 
                ? 'Continua a imparare dove avevi lasciato' 
                : 'Inizia il tuo viaggio nell\'apprendimento'
              }
            </p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Name (only for signup) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    👤 Nome completo
                  </label>
                  <input
                    type="text"
                    placeholder="Il tuo nome"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors outline-none"
                    required={!isLogin}
                  />
                </div>
              )}
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  📧 Email
                </label>
                <input
                  type="email"
                  placeholder="la-tua-email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors outline-none"
                  required
                />
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  🔒 Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isLogin ? "La tua password" : "Scegli una password sicura"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors outline-none pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-gray-500">
                    Minimum 6 caratteri
                  </p>
                )}
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <p className="text-red-800 text-sm font-medium">
                    ❌ {error}
                  </p>
                </div>
              )}
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    ⏳ {isLogin ? 'Accesso in corso...' : 'Creazione account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? '🔑 Accedi' : '✨ Crea Account'}
                  </>
                )}
              </button>
            </form>
            
            {/* Forgot Password (only for login) */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                >
                  Hai dimenticato la password?
                </button>
              </div>
            )}
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">oppure</span>
              </div>
            </div>
            
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-12 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              {loading ? (
                '⏳ Caricamento...'
              ) : (
                <>
                  🚀 {isLogin ? 'Accedi con Google' : 'Registrati con Google'}
                </>
              )}
            </button>
            
            {/* Switch Mode */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
                {' '}
                <button
                  type="button"
                  onClick={switchMode}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 hover:underline font-medium disabled:opacity-50"
                >
                  {isLogin ? 'Registrati' : 'Accedi'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>🔒 I tuoi dati sono sicuri e sincronizzati nel cloud</p>
        </div>
      </div>
    </div>
  );
};

// Migration View Component
export const MigrationView = ({ onComplete, onSkip }) => {
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const handleMigration = async () => {
    setMigrating(true);
    try {
      // This would be called from the main app context where useFirebaseWords is available
      const result = await window.migrateFromLocalStorage?.();
      
      if (result?.success) {
        setMigrationResult(result);
        setMigrated(true);
        setTimeout(() => onComplete(result), 3000);
      } else {
        throw new Error(result?.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration failed:', error);
      alert(`Errore migrazione: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleSkip = () => {
    if (window.confirm('⚠️ Saltare la migrazione? I dati locali non verranno trasferiti nel cloud.')) {
      onSkip();
    }
  };

  if (migrated && migrationResult) {
    return (
      <div className="bg-green-50 border-green-200 border-2 rounded-2xl max-w-md mx-auto">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Migrazione Completata!</h3>
          <p className="text-green-700 mb-4">I tuoi dati sono ora salvati nel cloud</p>
          
          <div className="bg-white rounded-lg p-4 text-sm text-left">
            <h4 className="font-semibold mb-2">📊 Dati migrati:</h4>
            <ul className="space-y-1 text-green-700">
              <li>✓ {migrationResult.wordsCount} parole</li>
              <li>✓ {migrationResult.testsCount} test</li>
              <li>✓ {migrationResult.performanceCount} performance parole</li>
              {migrationResult.hasStats && <li>✓ Statistiche globali</li>}
            </ul>
          </div>
          
          <p className="text-sm text-green-600 mt-4">
            Reindirizzamento all'app in corso...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-blue-200 border-2 rounded-2xl max-w-md mx-auto">
      <div className="p-6">
        <h2 className="text-blue-800 text-xl font-bold flex items-center gap-2 mb-4">
          <span className="text-2xl">🚀</span>
          Migrazione al Cloud
        </h2>
        
        <div className="space-y-4">
          <div className="text-blue-700">
            <p className="mb-3">
              Abbiamo rilevato dati esistenti nel tuo browser locale. 
              Vuoi trasferirli nel cloud per sincronizzarli tra dispositivi?
            </p>
            
            <div className="bg-white rounded-lg p-3 text-sm">
              <h4 className="font-semibold mb-2">🔍 Dati rilevati:</h4>
              <ul className="space-y-1">
                <li>📝 Parole del vocabolario</li>
                <li>📊 Statistiche di apprendimento</li>
                <li>📈 Cronologia test</li>
                <li>🎯 Performance individuali parole</li>
              </ul>
            </div>
            
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800 mt-3">
              <strong>💡 Raccomandato:</strong> La migrazione permette di:
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Sincronizzare tra dispositivi</li>
                <li>Backup automatico nel cloud</li>
                <li>Non perdere mai i tuoi progressi</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="w-full bg-blue-600 text-white h-12 rounded-xl hover:bg-blue-700 transition-colors"
            >
              {migrating ? (
                <>
                  ⏳ Migrazione in corso...
                </>
              ) : (
                '🚀 Migra i Dati al Cloud'
              )}
            </button>
            
            <button
              onClick={handleSkip}
              disabled={migrating}
              className="w-full border-2 border-gray-300 h-12 rounded-xl hover:bg-gray-50 transition-colors"
            >
              ⏭️ Salta Migrazione
            </button>
          </div>
          
          <p className="text-xs text-blue-600 text-center">
            La migrazione è sicura e non modifica i dati locali
          </p>
        </div>
      </div>
    </div>
  );
};