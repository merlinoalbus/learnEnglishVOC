// src/App.js - VERSIONE SEMPLICE E FUNZIONALE
import React, { useState, useEffect } from 'react';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { firebaseService } from './services/firebaseService';

// 🔐 Login Component
const LoginView = ({ onLogin, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password, isSignUp ? displayName : null, isSignUp);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 text-center">
          <div className="text-4xl mb-2">🧠</div>
          <h1 className="text-2xl font-bold">Vocabulary Master</h1>
          <p className="text-blue-100 text-sm">
            {isSignUp ? 'Crea il tuo account' : 'Accedi al tuo account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Nome completo"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Caricamento...' : (isSignUp ? '📝 Registrati' : '🔑 Accedi')}
          </button>
        </form>

        {/* Toggle */}
        <div className="px-6 pb-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isSignUp ? 'Hai già un account? Accedi' : 'Non hai un account? Registrati'}
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔄 Migration Component
const MigrationView = ({ onComplete, onSkip }) => {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const handleMigration = async () => {
    setMigrating(true);
    try {
      console.log('🔄 Starting migration...');
      const result = await firebaseService.migrateFromLocalStorage();
      console.log('Migration result:', result);
      
      setResult(result);
      
      if (result.success) {
        setTimeout(() => onComplete(result), 2000);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      setResult({ success: false, error: error.message });
    } finally {
      setMigrating(false);
    }
  };

  if (result?.success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-green-800 mb-2">Migrazione Completata!</h2>
        <div className="text-green-600 space-y-1">
          <p>✅ {result.wordsCount} parole migrate</p>
          <p>✅ {result.testsCount} test migrati</p>
          <p>✅ {result.performanceCount} performance migrate</p>
          {result.hasStats && <p>✅ Statistiche migrate</p>}
        </div>
        <p className="text-gray-600 mt-4">I tuoi dati sono ora al sicuro nel cloud!</p>
      </div>
    );
  }

  if (result?.success === false) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-red-800 mb-2">Errore Migrazione</h2>
        <p className="text-red-600 mb-4">{result.error}</p>
        <div className="space-x-4">
          <button
            onClick={() => setResult(null)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            🔄 Riprova
          </button>
          <button
            onClick={onSkip}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            ⏭️ Salta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <h2 className="text-2xl font-bold text-blue-800 mb-4">Migrazione Dati</h2>
        <p className="text-gray-600 mb-6">
          Abbiamo trovato dati salvati localmente. Vuoi spostarli nel cloud per sincronizzarli tra dispositivi?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleMigration}
            disabled={migrating}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {migrating ? '⏳ Migrazione in corso...' : '🔄 Migra Dati nel Cloud'}
          </button>
          
          <button
            onClick={onSkip}
            disabled={migrating}
            className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-400 disabled:opacity-50"
          >
            ⏭️ Salta (inizia da zero)
          </button>
        </div>
      </div>
    </div>
  );
};

// 📱 Simple Dashboard
const Dashboard = ({ user, onLogout }) => {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load words
  useEffect(() => {
    const loadWords = async () => {
      try {
        const userWords = await firebaseService.getWords();
        setWords(userWords);
        console.log('Loaded words:', userWords.length);
      } catch (error) {
        console.error('Error loading words:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadWords();
  }, []);

  // Add word function
  const addWord = async (english, italian) => {
    try {
      const newWord = await firebaseService.addWord({
        english: english.trim(),
        italian: italian.trim(),
        learned: false,
        difficult: false
      });
      setWords(prev => [...prev, newWord]);
      return true;
    } catch (error) {
      console.error('Error adding word:', error);
      setError(error.message);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧠</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Vocabulary Master</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Cloud Sync Attivo</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Ciao, {user.displayName || user.email?.split('@')[0]}!
            </span>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
            >
              👋 Esci
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-blue-600">{words.length}</div>
            <div className="text-gray-600">Parole Totali</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-green-600">
              {words.filter(w => w.learned).length}
            </div>
            <div className="text-gray-600">Parole Apprese</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {words.filter(w => w.difficult).length}
            </div>
            <div className="text-gray-600">Parole Difficili</div>
          </div>
        </div>

        {/* Add Word */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Aggiungi Parola</h2>
          <AddWordForm onAdd={addWord} />
        </div>

        {/* Words List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold text-gray-800">📝 Le Tue Parole</h2>
          </div>
          
          {loading ? (
            <div className="p-6 text-center">
              <div className="text-2xl mb-2">⏳</div>
              <p className="text-gray-600">Caricamento parole...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-2xl mb-2">❌</div>
              <p className="text-red-600">{error}</p>
            </div>
          ) : words.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-gray-600">Nessuna parola ancora. Aggiungi la prima!</p>
            </div>
          ) : (
            <WordsList words={words} />
          )}
        </div>
      </div>
    </div>
  );
};

// 📝 Add Word Form
const AddWordForm = ({ onAdd }) => {
  const [english, setEnglish] = useState('');
  const [italian, setItalian] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!english.trim() || !italian.trim()) return;
    
    setAdding(true);
    const success = await onAdd(english, italian);
    if (success) {
      setEnglish('');
      setItalian('');
    }
    setAdding(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input
        type="text"
        placeholder="Parola inglese"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <input
        type="text"
        placeholder="Traduzione italiana"
        value={italian}
        onChange={(e) => setItalian(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <button
        type="submit"
        disabled={adding || !english.trim() || !italian.trim()}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {adding ? '⏳' : '➕'}
      </button>
    </form>
  );
};

// 📋 Words List
const WordsList = ({ words }) => {
  const displayWords = words.slice(0, 10); // Show first 10

  return (
    <div className="divide-y divide-gray-200">
      {displayWords.map((word, index) => (
        <div key={word.id || index} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900">{word.english}</div>
              <div className="text-gray-600">{word.italian}</div>
            </div>
            <div className="flex items-center gap-2">
              {word.learned && <span className="text-green-600">✅</span>}
              {word.difficult && <span className="text-orange-600">⚠️</span>}
            </div>
          </div>
        </div>
      ))}
      
      {words.length > 10 && (
        <div className="p-4 text-center text-gray-500">
          ... e altre {words.length - 10} parole
        </div>
      )}
    </div>
  );
};

// 🚀 Main App Component
const VocabularyApp = () => {
  const { 
    user, 
    loading, 
    error, 
    initialized,
    isAuthenticated, 
    signIn, 
    signUp, 
    logout 
  } = useFirebaseAuth();
  
  const [showMigration, setShowMigration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Check for migration when user logs in
  useEffect(() => {
    const checkMigration = () => {
      if (!isAuthenticated || migrationChecked) return;

      try {
        // Check localStorage for existing data
        const hasLocalWords = JSON.parse(localStorage.getItem('vocabularyWords') || '[]').length > 0;
        const hasLocalStats = Object.keys(JSON.parse(localStorage.getItem('vocabularyStats') || '{}')).length > 0;
        
        if (hasLocalWords || hasLocalStats) {
          console.log('🔄 Migration needed - local data found');
          setShowMigration(true);
        } else {
          console.log('✅ No migration needed');
          setMigrationChecked(true);
        }
      } catch (error) {
        console.error('❌ Migration check error:', error);
        setMigrationChecked(true);
      }
    };

    checkMigration();
  }, [isAuthenticated, migrationChecked]);

  // Handle login
  const handleLogin = async (email, password, displayName, isSignUp) => {
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (window.confirm('Sei sicuro di voler uscire?')) {
      await logout();
      setShowMigration(false);
      setMigrationChecked(false);
    }
  };

  // Loading screen
  if (loading || !initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🧠</div>
          <h2 className="text-2xl font-bold text-gray-800">Vocabulary Master</h2>
          <p className="text-gray-600 mt-2">Inizializzazione Firebase...</p>
          <div className="mt-4 w-8 h-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} loading={loading} error={error} />;
  }

  // Show migration if needed
  if (showMigration && !migrationChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🧠</div>
            <h1 className="text-2xl font-bold text-gray-800">
              Benvenuto, {user.displayName || user.email?.split('@')[0]}!
            </h1>
          </div>
          
          <MigrationView 
            onComplete={(result) => {
              console.log('Migration completed:', result);
              setShowMigration(false);
              setMigrationChecked(true);
            }}
            onSkip={() => {
              console.log('Migration skipped');
              setShowMigration(false);
              setMigrationChecked(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Main dashboard
  return <Dashboard user={user} onLogout={handleLogout} />;
};

export default VocabularyApp;