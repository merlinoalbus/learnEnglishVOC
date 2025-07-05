
// =====================================================
// 📁 src/hooks/useFirebaseAuth.js - SAFE VERSION  
// =====================================================

import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { firebaseService } from '../services/firebaseService';

export const useFirebaseAuth = () => {
  // ⭐ SAFE INITIALIZATION
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // 🔄 Monitor auth state changes with error handling
  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        console.log('🔐 Auth state changed:', user?.email || 'signed out');
        
        if (user) {
          setUser(user);
          setError(null);
          
          // Initialize Firebase service
          try {
            await firebaseService.initUser(user);
            console.log('✅ Firebase user initialized:', user.email);
          } catch (initError) {
            console.error('❌ Firebase init error:', initError);
            setError(initError.message);
          }
        } else {
          setUser(null);
          firebaseService.cleanup();
          console.log('👋 User signed out');
        }
      } catch (authError) {
        console.error('❌ Auth state change error:', authError);
        setError(authError.message);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    });

    return () => {
      console.log('🔄 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // ⭐ SAFE Sign up
  const signUp = async (email, password, displayName = '') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📝 Creating account for:', email);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName.trim()) {
        await updateProfile(result.user, { displayName: displayName.trim() });
      }
      
      console.log('✅ Account created successfully');
      return result.user;
      
    } catch (error) {
      console.error('❌ Sign up error:', error);
      
      let friendlyMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'Un account con questa email esiste già.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'La password deve essere di almeno 6 caratteri.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Indirizzo email non valido.';
      }
      
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SAFE Sign in
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔑 Signing in:', email);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Sign in successful');
      return result.user;
      
    } catch (error) {
      console.error('❌ Sign in error:', error);
      
      let friendlyMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        friendlyMessage = 'Nessun account trovato con questa email.';
      } else if (error.code === 'auth/wrong-password') {
        friendlyMessage = 'Password non corretta.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Indirizzo email non valido.';
      }
      
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SAFE Google sign in
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Signing in with Google...');
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      console.log('✅ Google sign in successful:', result.user.email);
      return result.user;
      
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      
      let friendlyMessage = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Accesso con Google annullato.';
      } else if (error.code === 'auth/popup-blocked') {
        friendlyMessage = 'Popup bloccato dal browser.';
      }
      
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SAFE Logout
  const logout = async () => {
    try {
      setLoading(true);
      console.log('👋 Signing out...');
      
      await signOut(auth);
      firebaseService.cleanup();
      
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      setError('Errore durante il logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ⭐ SAFE Reset password
  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error('❌ Password reset error:', error);
      
      let friendlyMessage = error.message;
      if (error.code === 'auth/user-not-found') {
        friendlyMessage = 'Nessun account trovato con questa email.';
      }
      
      setError(friendlyMessage);
      throw new Error(friendlyMessage);
    }
  };

  // ⭐ Check migration status
  const checkMigrationStatus = async () => {
    try {
      if (!user) return false;
      const words = await firebaseService.getWords();
      return Array.isArray(words) && words.length > 0;
    } catch (error) {
      console.error('❌ Migration status check error:', error);
      return false;
    }
  };

  // Clear error state
  const clearError = () => setError(null);

  return {
    // State
    user,
    loading,
    error,
    initialized,
    
    // Auth methods
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    
    // Utility methods
    checkMigrationStatus,
    clearError,
    
    // Computed values
    isAuthenticated: !!user,
    userEmail: user?.email || null,
    userDisplayName: user?.displayName || user?.email?.split('@')[0] || 'User'
  };
};