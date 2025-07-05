// src/components/FirebaseAppWrapper.js
import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { useFirebaseWords } from '../hooks/useFirebaseWords';
import { AuthView, MigrationView } from './auth/AuthView';

/**
 * 🔄 Wrapper principale che gestisce autenticazione e migrazione
 * Decide se mostrare login, migrazione, o app principale
 */
export const FirebaseAppWrapper = ({ children }) => {
  const [showMigration, setShowMigration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);
  
  const { 
    user, 
    loading: authLoading, 
    initialized, 
    isAuthenticated, 
    userDisplayName,
    userEmail,
    logout,
    checkMigrationStatus
  } = useFirebaseAuth();

  const { 
    migrateFromLocalStorage, 
    loading: wordsLoading
  } = useFirebaseWords();

  // 🔄 Check if migration is needed when user logs in
  useEffect(() => {
    const checkMigration = async () => {
      if (!isAuthenticated || migrationChecked) return;

      try {
        // Check localStorage for existing data
        const hasLocalWords = JSON.parse(localStorage.getItem('vocabulary_words') || '[]').length > 0;
        const hasLocalStats = Object.keys(JSON.parse(localStorage.getItem('vocabulary_stats') || '{}')).length > 0;
        const hasLocalHistory = JSON.parse(localStorage.getItem('vocabulary_test_history') || '[]').length > 0;
        
        // Check Firebase for existing data
        const hasFirebaseData = await checkMigrationStatus();
        
        // Show migration if has local data but no Firebase data
        if ((hasLocalWords || hasLocalStats || hasLocalHistory) && !hasFirebaseData) {
          console.log('🔄 Migration needed - local data found, no Firebase data');
          setShowMigration(true);
        } else {
          console.log('✅ No migration needed');
        }
        
        setMigrationChecked(true);
      } catch (error) {
        console.error('❌ Migration check error:', error);
        setMigrationChecked(true);
      }
    };

    checkMigration();
  }, [isAuthenticated, checkMigrationStatus, migrationChecked]);

  // 🚀 Handle migration completion
  const handleMigrationComplete = (result) => {
    console.log('✅ Migration completed:', result);
    setShowMigration(false);
    setMigrationChecked(true);
  };

  // ⏭️ Handle skip migration
  const handleSkipMigration = () => {
    console.log('⏭️ Migration skipped');
    setShowMigration(false);
    setMigrationChecked(true);
  };

  // 🔄 Expose migration function globally for MigrationView
  useEffect(() => {
    if (isAuthenticated) {
      window.migrateFromLocalStorage = migrateFromLocalStorage;
    } else {
      delete window.migrateFromLocalStorage;
    }

    return () => {
      delete window.migrateFromLocalStorage;
    };
  }, [isAuthenticated, migrateFromLocalStorage]);

  // 👋 Handle logout
  const handleLogout = async () => {
    if (window.confirm('Vuoi davvero disconnetterti?')) {
      try {
        await logout();
        setShowMigration(false);
        setMigrationChecked(false);
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    }
  };

  // 🔄 Loading screen
  if (authLoading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl animate-pulse">
            🧠
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <h2 className="text-xl font-semibold text-gray-800">Vocabulary Master</h2>
            <p className="text-gray-600">Inizializzazione in corso...</p>
          </div>
        </div>
      </div>
    );
  }

  // 🔐 Not authenticated - show login
  if (!isAuthenticated) {
    return <AuthView />;
  }

  // 🚀 Show migration screen if needed
  if (showMigration && !migrationChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* App Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
              🧠
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Benvenuto, {userDisplayName}!
            </h1>
          </div>

          <MigrationView 
            onComplete={handleMigrationComplete}
            onSkip={handleSkipMigration}
          />
        </div>
      </div>
    );
  }

  // ✅ Authenticated and ready - show main app with Firebase status bar
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Firebase Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left side - Connection status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Firebase Online</span>
            </div>
            
            {wordsLoading && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">Sync...</span>
              </div>
            )}
          </div>

          {/* Center - App title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-gray-800">
              🧠 Vocabulary Master
            </h1>
          </div>

          {/* Right side - User info and logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span className="text-sm text-gray-700 hidden sm:inline">
                {userDisplayName}
              </span>
            </div>
            
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 text-sm px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              title="Disconnetti"
            >
              <span className="hidden sm:inline">👋 Disconnetti</span>
              <span className="sm:hidden">👋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Content */}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs max-w-xs">
          <div>User: {userEmail}</div>
          <div>Mode: 🔥 Firebase</div>
          <div>Loading: {wordsLoading ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
};