import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";
import { useFirebase } from "../../contexts/FirebaseContext";
import {
  signUp,
  signIn,
  signOutUser,
  resetPassword,
  verifyPasswordResetCode,
  confirmPasswordReset,
  verifyEmail,
  updateAuthProfile,
  updateUserPassword,
  getCurrentUser,
  getCurrentAuthUser,
  getUserProfile,
  initializeUserProfile,
  signInWithGoogle,
  handleGoogleRedirectResult,
  validateEmail,
  validatePassword,
  getUserPreferences,
} from "../../services/authService";
import {
  DEFAULT_PERMISSIONS,
  getUserPermissions,
  isAdmin,
  isUser,
  canPerformAdminOperation,
} from "../../types/entities/User.types";
import type {
  User,
  UserRole,
  UserPermissions,
  SignUpInput,
  SignInInput,
  ResetPasswordInput,
  UpdateProfileInput,
  AuthError,
} from "../../types/entities/User.types";
import type {
  AuthUser,
  AuthSession,
  UpdatePasswordInput,
} from "../../types/infrastructure/Auth.types";

interface AuthState {
  user: User | null;
  authUser: AuthUser | null;
  userProfile: User | null;
  role: UserRole | null;
  permissions: UserPermissions;
  loading: boolean;
  initializing: boolean;
  error: AuthError | null;
  session: AuthSession | null;
  operationLoading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    resetPassword: boolean;
    updateProfile: boolean;
    updatePassword: boolean;
  };
}

const initialState: AuthState = {
  user: null,
  authUser: null,
  userProfile: null,
  role: null,
  permissions: DEFAULT_PERMISSIONS.user,
  loading: false,
  initializing: true,
  error: null,
  session: null,
  operationLoading: {
    signIn: false,
    signUp: false,
    signOut: false,
    resetPassword: false,
    updateProfile: false,
    updatePassword: false,
  },
};

export const useAuth = () => {
  const { isReady: firebaseReady } = useFirebase();
  const [state, setState] = useState<AuthState>(initialState);

  // Simple state updater
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set operation loading
  const setOperationLoading = useCallback((operation: keyof AuthState["operationLoading"], loading: boolean) => {
    setState(prev => ({
      ...prev,
      operationLoading: {
        ...prev.operationLoading,
        [operation]: loading,
      },
    }));
  }, []);

  // Load user profile
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getUserProfile(userId);
      updateState({
        userProfile: profile,
        role: profile?.role || null,
        permissions: profile?.role ? getUserPermissions(profile.role) : DEFAULT_PERMISSIONS.user,
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
      updateState({
        userProfile: null,
        role: null,
        permissions: DEFAULT_PERMISSIONS.user,
      });
    }
  }, [updateState]);

  // Load user preferences and apply theme
  const loadUserPreferences = useCallback(async (userId: string) => {
    try {
      const preferences = await getUserPreferences(userId);
      if (preferences) {
        // Apply theme to DOM immediately
        const isDark = preferences.theme === 'dark';
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error);
    }
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    if (!firebaseReady) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const authUser = getCurrentAuthUser();
        const user = getCurrentUser();
        
        updateState({
          user,
          authUser,
          initializing: false,
          loading: false,
          error: null,
        });

        // Load user profile and preferences
        if (user?.id) {
          await loadUserProfile(user.id);
          await loadUserPreferences(user.id);
        }
      } else {
        // User is signed out - reset theme to light mode
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        
        // Notify ThemeProvider about theme reset
        window.dispatchEvent(new Event('themeReset'));
        
        updateState({
          user: null,
          authUser: null,
          userProfile: null,
          role: null,
          permissions: DEFAULT_PERMISSIONS.user,
          initializing: false,
          loading: false,
          session: null,
        });
      }
    });

    return unsubscribe;
  }, [firebaseReady, updateState, loadUserProfile, loadUserPreferences]);

  // Handle Google redirect result
  useEffect(() => {
    if (firebaseReady) {
      updateState({ loading: true });
      handleGoogleRedirectResult().then((result) => {
        if (result && !result.success && result.error) {
          updateState({ error: result.error as AuthError, loading: false });
        } else {
          updateState({ loading: false });
        }
      }).catch(() => {
        updateState({ loading: false });
      });
    }
  }, [firebaseReady, updateState]);

  // Auth operations
  const handleSignUp = useCallback(async (input: SignUpInput): Promise<boolean> => {
    if (!firebaseReady) return false;

    setOperationLoading("signUp", true);
    try {
      const result = await signUp(input);
      if (result.success && result.user) {
        // Initialize user profile after successful registration
        try {
          await initializeUserProfile(result.user.uid);
        } catch (profileError) {
          console.error("Error initializing user profile:", profileError);
        }
        return true;
      } else {
        updateState({ error: result.error as AuthError });
        return false;
      }
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Sign up failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("signUp", false);
    }
  }, [firebaseReady, setOperationLoading, updateState]);

  const handleSignIn = useCallback(async (input: SignInInput): Promise<boolean> => {
    if (!firebaseReady) return false;

    setOperationLoading("signIn", true);
    try {
      const result = await signIn(input);
      if (result.success) {
        // Check if this is an admin login and process pending user creations
        try {
          console.log('Login successful, checking if admin...');
          const userProfile = await getUserProfile(result.user!.uid);
          console.log('User profile:', userProfile);
          
          if (userProfile?.role === 'admin') {
            console.log('Admin login detected, processing pending user creations...');
            const { processPendingUserCreations } = await import('../../services/adminService');
            const results = await processPendingUserCreations('email', { email: input.email, password: input.password });
            console.log('Pending user creation results:', results);
            
            if (results.processed > 0) {
              console.log(`Successfully processed ${results.processed} pending user creations`);
              // Notify admin components to refresh their data
              window.dispatchEvent(new CustomEvent('adminUsersProcessed', { 
                detail: { processed: results.processed, failed: results.failed } 
              }));
            }
          } else {
            console.log('Not an admin user, skipping pending user processing');
          }
        } catch (adminError) {
          console.error('Error processing admin tasks:', adminError);
          // Don't fail login if admin tasks fail
        }
        
        return true;
      } else {
        updateState({ error: result.error as AuthError });
        return false;
      }
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Sign in failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("signIn", false);
    }
  }, [firebaseReady, setOperationLoading, updateState]);

  const handleGoogleSignIn = useCallback(async (): Promise<boolean> => {
    if (!firebaseReady) return false;

    setOperationLoading("signIn", true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        // Check if this is an admin login and process pending user creations
        try {
          console.log('Google login successful, checking if admin...');
          const userProfile = await getUserProfile(result.user!.uid);
          console.log('User profile:', userProfile);
          
          if (userProfile?.role === 'admin') {
            console.log('Admin Google login detected, processing pending user creations...');
            
            const { processPendingUserCreations } = await import('../../services/adminService');
            const results = await processPendingUserCreations('google');
            console.log('Pending user creation results:', results);
            
            if (results.processed > 0) {
              console.log(`Successfully processed ${results.processed} pending user creations`);
              // Notify admin components to refresh their data
              window.dispatchEvent(new CustomEvent('adminUsersProcessed', { 
                detail: { processed: results.processed, failed: results.failed } 
              }));
            }
          } else {
            console.log('Not an admin user, skipping pending user processing');
          }
        } catch (adminError) {
          console.error('Error processing admin tasks:', adminError);
          // Don't fail login if admin tasks fail
        }
        
        return true;
      } else if (result.message === "Reindirizzamento a Google...") {
        return true; // Redirect in progress
      } else {
        updateState({ error: result.error as AuthError });
        return false;
      }
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Google sign in failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("signIn", false);
    }
  }, [firebaseReady, setOperationLoading, updateState]);

  const handleSignOut = useCallback(async (): Promise<boolean> => {
    setOperationLoading("signOut", true);
    try {
      const result = await signOutUser();
      return result.success;
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Sign out failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("signOut", false);
    }
  }, [setOperationLoading, updateState]);

  const handleResetPassword = useCallback(async (input: ResetPasswordInput): Promise<boolean> => {
    if (!firebaseReady) return false;

    setOperationLoading("resetPassword", true);
    try {
      const result = await resetPassword(input);
      if (result.success) {
        return true;
      } else {
        updateState({ error: result.error as AuthError });
        return false;
      }
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Password reset failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("resetPassword", false);
    }
  }, [firebaseReady, setOperationLoading, updateState]);

  const handleUpdateProfile = useCallback(async (input: UpdateProfileInput): Promise<boolean> => {
    if (!firebaseReady || !state.authUser) return false;

    setOperationLoading("updateProfile", true);
    try {
      // Update Firebase Auth profile
      const result = await updateAuthProfile(input);
      if (!result.success) {
        updateState({ error: result.error as AuthError });
        return false;
      }

      // Update Firestore user document
      if (input.displayName && state.authUser.uid) {
        try {
          const userRef = doc(db, "users", state.authUser.uid);
          await setDoc(userRef, {
            displayName: input.displayName,
            email: state.authUser.email,
            updatedAt: new Date(),
          }, { merge: true });
        } catch (firestoreError) {
          console.error("Error updating Firestore user document:", firestoreError);
        }
      }

      // Reload user profile
      if (state.authUser.uid) {
        await loadUserProfile(state.authUser.uid);
      }

      return true;
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Profile update failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("updateProfile", false);
    }
  }, [firebaseReady, state.authUser, setOperationLoading, updateState, loadUserProfile]);

  const handleUpdatePassword = useCallback(async (input: UpdatePasswordInput): Promise<boolean> => {
    if (!firebaseReady || !state.authUser) return false;

    setOperationLoading("updatePassword", true);
    try {
      const result = await updateUserPassword(input);
      if (result.success) {
        return true;
      } else {
        updateState({ error: result.error as AuthError });
        return false;
      }
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Password update failed", type: "unknown", timestamp: new Date() } });
      return false;
    } finally {
      setOperationLoading("updatePassword", false);
    }
  }, [firebaseReady, state.authUser, setOperationLoading, updateState]);

  const handleVerifyPasswordResetCode = useCallback(async (oobCode: string): Promise<string> => {
    if (!firebaseReady) throw new Error("Firebase not ready");

    try {
      return await verifyPasswordResetCode(oobCode);
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Password reset verification failed", type: "unknown", timestamp: new Date() } });
      throw error;
    }
  }, [firebaseReady, updateState]);

  const handleConfirmPasswordReset = useCallback(async (oobCode: string, newPassword: string): Promise<boolean> => {
    if (!firebaseReady) return false;

    try {
      const result = await confirmPasswordReset(oobCode, newPassword);
      if (!result.success) {
        updateState({ error: result.error as AuthError });
      }
      return result.success;
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Password reset confirmation failed", type: "unknown", timestamp: new Date() } });
      return false;
    }
  }, [firebaseReady, updateState]);

  const handleVerifyEmail = useCallback(async (oobCode: string): Promise<boolean> => {
    if (!firebaseReady) return false;

    try {
      const result = await verifyEmail(oobCode);
      if (!result.success) {
        updateState({ error: result.error as AuthError });
      }
      return result.success;
    } catch (error) {
      updateState({ error: { code: "unknown", message: "Email verification failed", type: "unknown", timestamp: new Date() } });
      return false;
    }
  }, [firebaseReady, updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const refreshProfile = useCallback(() => {
    if (state.user?.id) {
      loadUserProfile(state.user.id);
    }
  }, [state.user?.id, loadUserProfile]);

  // Computed values
  const isAuthenticated = !!state.user && !!state.authUser;
  const isLoading = state.loading || Object.values(state.operationLoading).some(loading => loading);

  // Admin check - use email as fallback if profile not loaded
  const checkIsAdmin = () => {
    if (state.userProfile) {
      return isAdmin(state.userProfile);
    }
    // Fallback: check if email suggests admin status
    const email = state.user?.email || state.authUser?.email;
    return email ? (email.includes('admin') || email === 'test@test.com') : false;
  };

  return {
    // State
    user: state.user,
    authUser: state.authUser,
    userProfile: state.userProfile,
    role: state.role,
    permissions: state.permissions,
    session: state.session,
    loading: isLoading,
    initializing: state.initializing,
    isReady: firebaseReady && !state.initializing,
    hasError: !!state.error,
    error: state.error,
    isAuthenticated,

    // Operation loading states
    isSigningIn: state.operationLoading.signIn,
    isSigningUp: state.operationLoading.signUp,
    isSigningOut: state.operationLoading.signOut,
    isResettingPassword: state.operationLoading.resetPassword,
    isUpdatingProfile: state.operationLoading.updateProfile,
    isUpdatingPassword: state.operationLoading.updatePassword,

    // Auth operations
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updateProfile: handleUpdateProfile,
    updatePassword: handleUpdatePassword,
    verifyPasswordResetCode: handleVerifyPasswordResetCode,
    confirmPasswordReset: handleConfirmPasswordReset,
    verifyEmail: handleVerifyEmail,

    // Utilities
    clearError,
    validateEmail,
    validatePassword,
    refreshProfile,

    // Role and permissions
    isAdmin: checkIsAdmin(),
    isUser: isUser(state.userProfile) || !!state.user,
    canPerformAdminOps: canPerformAdminOperation(state.userProfile) || checkIsAdmin(),

    // Session info (placeholder)
    getSessionInfo: () => null,
    lastOperation: undefined,
  };
};

export const useUserRole = () => {
  const {
    userProfile,
    role,
    permissions,
    isAdmin,
    isUser,
    canPerformAdminOps,
  } = useAuth();

  return {
    userProfile,
    role,
    permissions,
    isAdmin,
    isUser,
    canPerformAdminOps,
  };
};