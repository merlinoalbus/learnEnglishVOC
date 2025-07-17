import React, { useState, useEffect, useRef, useCallback } from "react";
import type {
  User,
  AuthError,
  SignUpInput,
  SignInInput,
  ResetPasswordInput,
  UpdateProfileInput,
  UserRole,
  UserPermissions,
} from "../../types/entities/User.types";
import {
  DEFAULT_PERMISSIONS,
  getUserPermissions,
  isAdmin,
  isUser,
  canPerformAdminOperation,
} from "../../types/entities/User.types";
import type {
  AuthUser,
  AuthSession,
  UpdatePasswordInput,
} from "../../types/infrastructure/Auth.types";
import { useFirebase } from "../../contexts/FirebaseContext";
import { auth, db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
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
  isAuthenticated,
  onAuthStateChange,
  createUserSession,
  updateSessionActivity,
  validateSession,
  validateEmail,
  validatePassword,
  getUserProfile,
  initializeUserProfile,
  signInWithGoogle,
  handleGoogleRedirectResult,
} from "../../services/authService";

const AUTH_HOOK_CONFIG = {
  sessionUpdateInterval: 60000,
  sessionValidationInterval: 300000,
  maxRetries: 3,
  retryDelay: 1000,
  enableDebugLogging: process.env.NODE_ENV === "development",
  strictModeTimeout: 3000, // Timeout for StrictMode double mounting (increased)
  forceCompleteTimeout: 8000, // Force completion if stuck in StrictMode
};

const debugLog = (message: string, data?: any) => {
  // Debug logging disabled for production
};

const normalizeAuthError = (error: any): AuthError => {
  if (error && typeof error === "object" && "code" in error) {
    return error as AuthError;
  }
  return {
    code: "unknown",
    message: error?.message || "Errore di autenticazione sconosciuto",
    type: "unknown",
    timestamp: new Date(),
  };
};

interface AuthHookState {
  user: User | null;
  authUser: AuthUser | null;
  userProfile: User | null;
  role: UserRole | null;
  permissions: UserPermissions;
  loading: boolean;
  initializing: boolean;
  operationLoading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    resetPassword: boolean;
    updateProfile: boolean;
    updatePassword: boolean;
  };
  error: AuthError | null;
  session: AuthSession | null;
  lastOperation?: {
    type: string;
    timestamp: Date;
    success: boolean;
  };
}

// Global state to persist across StrictMode remounts
let globalAuthState: {
  isListenerSetup: boolean;
  lastUser: User | null;
  initializationComplete: boolean;
  initStartTime: number;
} = {
  isListenerSetup: false,
  lastUser: null,
  initializationComplete: false,
  initStartTime: 0,
};

// Global reset function for stuck initialization
(window as any).__resetAuthState = () => {
  console.log("🔧 Resetting global auth state");
  globalAuthState.isListenerSetup = false;
  globalAuthState.initializationComplete = false;
  globalAuthState.lastUser = null;
  globalAuthState.initStartTime = Date.now();
  window.location.reload();
};

// Expose global state for AppLayout consistency
(window as any).globalAuthState = globalAuthState;

export const useAuth = () => {
  const { isReady: firebaseReady, error: firebaseError } = useFirebase();
  const [state, setState] = useState<AuthHookState>({
    user: globalAuthState.lastUser,
    authUser: null,
    userProfile: null,
    role: null,
    permissions: DEFAULT_PERMISSIONS.user,
    loading: false,
    initializing: !globalAuthState.initializationComplete,
    operationLoading: {
      signIn: false,
      signUp: false,
      signOut: false,
      resetPassword: false,
      updateProfile: false,
      updatePassword: false,
    },
    error: null,
    session: null,
  });

  const authUnsubscribeRef = useRef<(() => void) | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const hasSetupListenerRef = useRef(false);

  const safeSetState = useCallback(
    (updater: (prev: AuthHookState) => AuthHookState) => {
      // In StrictMode, React può smontare/rimontare rapidamente i componenti
      // Rimuoviamo il check isMounted per permettere l'aggiornamento dello state
      setState(updater);
    },
    []
  );

  const loadUserProfile = useCallback(
    async (userId: string) => {
      try {
        debugLog("Loading user profile", { userId });
        const profile = await getUserProfile(userId);
        safeSetState((prev) => ({
          ...prev,
          userProfile: profile,
          role: profile?.role || null,
          permissions: profile?.role
            ? getUserPermissions(profile.role)
            : DEFAULT_PERMISSIONS.user,
        }));
        debugLog("User profile loaded successfully", {
          role: profile?.role,
          email: profile?.email,
        });
      } catch (error) {
        console.error("Error loading user profile:", error);
        safeSetState((prev) => ({
          ...prev,
          userProfile: null,
          role: null,
          permissions: DEFAULT_PERMISSIONS.user,
        }));
      }
    },
    [safeSetState]
  );

  const setOperationLoading = useCallback(
    (operation: keyof AuthHookState["operationLoading"], loading: boolean) => {
      safeSetState((prev) => ({
        ...prev,
        operationLoading: {
          ...prev.operationLoading,
          [operation]: loading,
        },
      }));
    },
    [safeSetState]
  );

  const updateLastOperation = useCallback(
    (type: string, success: boolean) => {
      safeSetState((prev) => ({
        ...prev,
        lastOperation: {
          type,
          timestamp: new Date(),
          success,
        },
      }));
    },
    [safeSetState]
  );

  const startSession = useCallback(
    (authUser: AuthUser) => {
      const session = createUserSession(authUser);
      safeSetState((prev) => ({
        ...prev,
        session,
      }));
      debugLog("Session started", { sessionId: session.sessionId });

      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }

      sessionTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          safeSetState((prev) => {
            if (!prev.session) return prev;

            const updatedSession = updateSessionActivity(prev.session);

            if (!validateSession(updatedSession)) {
              debugLog("Session expired, signing out");
              handleSignOut();
              return prev;
            }

            return {
              ...prev,
              session: updatedSession,
            };
          });
        }
      }, AUTH_HOOK_CONFIG.sessionUpdateInterval);
    },
    [safeSetState]
  );

  const endSession = useCallback(() => {
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
    safeSetState((prev) => ({
      ...prev,
      session: null,
    }));
    debugLog("Session ended");
  }, [safeSetState]);

  // STRICTMODE-SAFE AUTH STATE LISTENER
  useEffect(() => {
    if (!firebaseReady) {
      debugLog("Firebase not ready, skipping auth state listener setup");
      return;
    }

    // Avoid duplicate listeners in StrictMode
    if (globalAuthState.isListenerSetup || hasSetupListenerRef.current) {
      debugLog("Auth listener already setup, skipping duplicate");

      // If initialization was already complete, update state immediately
      if (globalAuthState.initializationComplete) {
        safeSetState((prev) => ({ ...prev, initializing: false }));
      }

      return;
    }

    debugLog("Setting up auth state listener (first time)");
    hasSetupListenerRef.current = true;
    globalAuthState.isListenerSetup = true;
    globalAuthState.initStartTime = Date.now();

    // DEBUG: Direct Firebase auth listener per vedere se Firebase funziona
    const directUnsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      debugLog("🔴 DIRECT Firebase auth state changed", {
        uid: firebaseUser?.uid || "null",
        email: firebaseUser?.email,
        exists: !!firebaseUser
      });
    });

    const unsubscribe = onAuthStateChange((user) => {
      debugLog("🚨 Auth state changed", {
        uid: user?.id || "null",
        authenticated: !!user,
        email: user?.email,
        userObject: user
      });

      // Update global state
      globalAuthState.lastUser = user;
      globalAuthState.initializationComplete = true;
      
      // Notifica AppLayout del cambiamento
      window.dispatchEvent(new CustomEvent('globalAuthStateChanged'));

      if (user) {
        // Usa la funzione esistente che gestisce correttamente la conversione
        const authUser = getCurrentAuthUser();
        
        debugLog("User authenticated, getting authUser", { 
          authUser,
          authUserExists: !!authUser,
          userEmail: user.email
        });

        safeSetState((prev) => {
          debugLog("🔄 Setting authenticated state", {
            user: user?.email,
            authUser: authUser?.email,
            prevUser: prev.user?.email,
            prevAuthUser: prev.authUser?.email,
            wasInitializing: prev.initializing
          });
          
          // Force initialization complete when user authenticates
          globalAuthState.initializationComplete = true;
          
          return {
            ...prev,
            user,
            authUser,
            initializing: false,
            loading: false,
            error: null,
          };
        });

        if (authUser) {
          startSession(authUser);
          loadUserProfile(user.id);
        }
      } else {
        debugLog("User not authenticated, clearing state");
        
        // Update global state anche per logout
        globalAuthState.lastUser = null;
        window.dispatchEvent(new CustomEvent('globalAuthStateChanged'));
        
        safeSetState((prev) => ({
          ...prev,
          user: null,
          authUser: null,
          userProfile: null,
          role: null,
          permissions: DEFAULT_PERMISSIONS.user,
          initializing: false,
        }));
        endSession();
      }
    });

    authUnsubscribeRef.current = unsubscribe;

    // StrictMode safety timeout
    const safetyTimeout = setTimeout(() => {
      if (!globalAuthState.initializationComplete) {
        debugLog("🚨 SAFETY TIMEOUT: Forcing initialization complete");
        globalAuthState.initializationComplete = true;
        safeSetState((prev) => ({
          ...prev,
          initializing: false,
        }));
      }
    }, AUTH_HOOK_CONFIG.strictModeTimeout);

    // Force completion timeout for StrictMode issues
    const forceCompleteTimeout = setTimeout(() => {
      if (!globalAuthState.initializationComplete) {
        debugLog("🚨 FORCE COMPLETE: StrictMode stuck, forcing completion");
        globalAuthState.initializationComplete = true;
        globalAuthState.isListenerSetup = true;
        safeSetState((prev) => ({
          ...prev,
          initializing: false,
          loading: false,
        }));
      }
    }, AUTH_HOOK_CONFIG.forceCompleteTimeout);

    return () => {
      clearTimeout(safetyTimeout);
      clearTimeout(forceCompleteTimeout);
      directUnsubscribe(); // Cleanup direct listener
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = null;
        globalAuthState.isListenerSetup = false;
        hasSetupListenerRef.current = false;
        debugLog("Auth state listener cleaned up");
      }
    };
  }, [firebaseReady, safeSetState, startSession, endSession, loadUserProfile]);

  // Handle Google redirect result on mount
  useEffect(() => {
    if (firebaseReady) {
      handleGoogleRedirectResult().then((result) => {
        if (result) {
          if (result.success) {
            debugLog("Google redirect completed successfully");
          } else {
            safeSetState((prev) => ({
              ...prev,
              error: normalizeAuthError(result.error),
            }));
          }
        }
      });
    }
  }, [firebaseReady, safeSetState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      debugLog("Hook cleaned up");
    };
  }, []);

  // AUTH OPERATIONS (keeping all the original ones)
  const handleSignUp = useCallback(
    async (input: SignUpInput): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for sign up");
        return false;
      }

      setOperationLoading("signUp", true);
      try {
        debugLog("Sign up attempt", { email: input.email });
        const result = await signUp(input);
        if (result.success && result.user) {
          updateLastOperation("signUp", true);
          debugLog("Sign up successful", { uid: result.user.uid });
          
          // Initialize user profile after successful registration
          try {
            await initializeUserProfile(result.user.uid);
          } catch (profileError) {
            console.error("Error initializing user profile:", profileError);
          }
          
          return true;
        } else {
          throw result.error || new Error("Sign up failed");
        }
      } catch (error) {
        debugLog("Sign up failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        updateLastOperation("signUp", false);
        return false;
      } finally {
        setOperationLoading("signUp", false);
      }
    },
    [firebaseReady, setOperationLoading, updateLastOperation, safeSetState]
  );

  const handleSignIn = useCallback(
    async (input: SignInInput): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for sign in");
        return false;
      }

      setOperationLoading("signIn", true);
      try {
        debugLog("Sign in attempt", { email: input.email });
        const result = await signIn(input);
        if (result.success && result.user) {
          updateLastOperation("signIn", true);
          debugLog("Sign in successful", { uid: result.user.uid });
          return true;
        } else {
          throw result.error || new Error("Sign in failed");
        }
      } catch (error) {
        debugLog("Sign in failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        updateLastOperation("signIn", false);
        return false;
      } finally {
        setOperationLoading("signIn", false);
      }
    },
    [firebaseReady, setOperationLoading, updateLastOperation, safeSetState]
  );

  const handleGoogleSignIn = useCallback(async (): Promise<boolean> => {
    if (!firebaseReady) {
      debugLog("Firebase not ready for Google sign in");
      return false;
    }

    setOperationLoading("signIn", true);
    try {
      debugLog("Google sign in attempt");
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        updateLastOperation("googleSignIn", true);
        debugLog("Google sign in successful", { uid: result.user.uid });
        return true;
      } else if (result.message === "Reindirizzamento a Google...") {
        // Redirect in progress
        return true;
      } else {
        throw result.error || new Error("Google sign in failed");
      }
    } catch (error) {
      debugLog("Google sign in failed", error);
      safeSetState((prev) => ({
        ...prev,
        error: normalizeAuthError(error),
      }));
      updateLastOperation("googleSignIn", false);
      return false;
    } finally {
      setOperationLoading("signIn", false);
    }
  }, [firebaseReady, setOperationLoading, updateLastOperation, safeSetState]);

  const handleSignOut = useCallback(async (): Promise<boolean> => {
    setOperationLoading("signOut", true);
    try {
      debugLog("Sign out attempt");
      const result = await signOutUser();
      if (result.success) {
        // Reset global state on logout
        globalAuthState.lastUser = null;
        globalAuthState.initializationComplete = false;

        updateLastOperation("signOut", true);
        debugLog("Sign out successful");
        return true;
      } else {
        throw result.error || new Error("Sign out failed");
      }
    } catch (error) {
      debugLog("Sign out failed", error);
      safeSetState((prev) => ({
        ...prev,
        error: normalizeAuthError(error),
      }));
      updateLastOperation("signOut", false);
      return false;
    } finally {
      setOperationLoading("signOut", false);
    }
  }, [setOperationLoading, updateLastOperation, safeSetState]);

  const handleResetPassword = useCallback(
    async (input: ResetPasswordInput): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for password reset");
        return false;
      }

      setOperationLoading("resetPassword", true);
      try {
        debugLog("Password reset attempt", { email: input.email });
        const result = await resetPassword(input);
        if (result.success) {
          updateLastOperation("resetPassword", true);
          debugLog("Password reset successful");
          return true;
        } else {
          throw result.error || new Error("Password reset failed");
        }
      } catch (error) {
        debugLog("Password reset failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        updateLastOperation("resetPassword", false);
        return false;
      } finally {
        setOperationLoading("resetPassword", false);
      }
    },
    [firebaseReady, setOperationLoading, updateLastOperation, safeSetState]
  );

  const handleVerifyPasswordResetCode = useCallback(
    async (oobCode: string): Promise<string> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for password reset verification");
        throw new Error("Firebase not ready");
      }

      try {
        debugLog("Verifying password reset code");
        const email = await verifyPasswordResetCode(oobCode);
        debugLog("Password reset code verified", { email });
        return email;
      } catch (error) {
        debugLog("Password reset code verification failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        throw error;
      }
    },
    [firebaseReady, safeSetState]
  );

  const handleConfirmPasswordReset = useCallback(
    async (oobCode: string, newPassword: string): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for password reset confirmation");
        return false;
      }

      try {
        debugLog("Confirming password reset");
        const result = await confirmPasswordReset(oobCode, newPassword);
        if (result.success) {
          debugLog("Password reset confirmed");
          return true;
        } else {
          throw result.error || new Error("Password reset confirmation failed");
        }
      } catch (error) {
        debugLog("Password reset confirmation failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        return false;
      }
    },
    [firebaseReady, safeSetState]
  );

  const handleVerifyEmail = useCallback(
    async (oobCode: string): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for email verification");
        return false;
      }

      try {
        debugLog("Verifying email");
        const result = await verifyEmail(oobCode);
        if (result.success) {
          debugLog("Email verified");
          return true;
        } else {
          throw result.error || new Error("Email verification failed");
        }
      } catch (error) {
        debugLog("Email verification failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        return false;
      }
    },
    [firebaseReady, safeSetState]
  );

  const handleUpdateProfile = useCallback(
    async (input: UpdateProfileInput): Promise<boolean> => {
      if (!firebaseReady || !state.authUser) {
        debugLog(
          "Firebase not ready or user not authenticated for profile update"
        );
        return false;
      }

      setOperationLoading("updateProfile", true);
      try {
        debugLog("Profile update attempt", input);
        
        // Update Firebase Auth profile
        const result = await updateAuthProfile(input);
        if (!result.success) {
          throw result.error || new Error("Profile update failed");
        }
        
        // Update Firestore user document - use authUser.uid directly
        if (input.displayName && state.authUser?.uid) {
          try {
            const userRef = doc(db, "users", state.authUser.uid);
            await updateDoc(userRef, {
              displayName: input.displayName,
            });
            debugLog("Firestore user document updated");
          } catch (firestoreError) {
            console.error("Error updating Firestore user document:", firestoreError);
          }
        }
        
        // Reload user profile to get updated data
        if (state.authUser?.uid) {
          await loadUserProfile(state.authUser.uid);
        }
        
        updateLastOperation("updateProfile", true);
        debugLog("Profile update successful");
        return true;
      } catch (error) {
        debugLog("Profile update failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        updateLastOperation("updateProfile", false);
        return false;
      } finally {
        setOperationLoading("updateProfile", false);
      }
    },
    [
      firebaseReady,
      state.authUser,
      state.userProfile,
      setOperationLoading,
      updateLastOperation,
      safeSetState,
      loadUserProfile,
    ]
  );

  const handleUpdatePassword = useCallback(
    async (input: UpdatePasswordInput): Promise<boolean> => {
      if (!firebaseReady || !state.authUser) {
        debugLog(
          "Firebase not ready or user not authenticated for password update"
        );
        return false;
      }

      setOperationLoading("updatePassword", true);
      try {
        debugLog("Password update attempt");
        const result = await updateUserPassword(input);
        if (result.success) {
          updateLastOperation("updatePassword", true);
          debugLog("Password update successful");
          return true;
        } else {
          throw result.error || new Error("Password update failed");
        }
      } catch (error) {
        debugLog("Password update failed", error);
        safeSetState((prev) => ({
          ...prev,
          error: normalizeAuthError(error),
        }));
        updateLastOperation("updatePassword", false);
        return false;
      } finally {
        setOperationLoading("updatePassword", false);
      }
    },
    [
      firebaseReady,
      state.authUser,
      setOperationLoading,
      updateLastOperation,
      safeSetState,
    ]
  );

  const clearError = useCallback(() => {
    safeSetState((prev) => ({
      ...prev,
      error: null,
    }));
  }, [safeSetState]);

  const checkAuthenticated = useCallback((): boolean => {
    const isAuth = !!state.user && !!state.authUser;
    debugLog("🔍 checkAuthenticated", {
      hasUser: !!state.user,
      hasAuthUser: !!state.authUser,
      isAuthenticated: isAuth,
      userEmail: state.user?.email,
      authUserEmail: state.authUser?.email
    });
    return isAuth;
  }, [state.user, state.authUser]);

  const getSessionInfo = useCallback(() => {
    return state.session
      ? {
          sessionId: state.session.sessionId,
          startedAt: state.session.startedAt,
          duration: state.session.duration,
          isActive: state.session.isActive,
        }
      : null;
  }, [state.session]);

  // Calculate derived state
  const isLoading =
    state.loading ||
    Object.values(state.operationLoading).some((loading) => loading);
  const isReady = firebaseReady && !state.initializing;

  // Debug final state (BEFORE any early returns)
  const finalIsAuthenticated = !!state.user && !!state.authUser;
  
  useEffect(() => {
    debugLog("🔍 useAuth final state", {
      isAuthenticated: finalIsAuthenticated,
      hasUser: !!state.user,
      hasAuthUser: !!state.authUser,
      isReady,
      firebaseReady,
      loading: isLoading,
      initializing: state.initializing
    });
  }, [finalIsAuthenticated, state.user, state.authUser, isReady, firebaseReady, isLoading, state.initializing]);

  // Handle Firebase error
  if (firebaseError) {
    return {
      user: null,
      authUser: null,
      isAuthenticated: false,
      loading: false,
      initializing: false,
      isReady: false,
      error: {
        code: "firebase-init-error",
        message: "Firebase initialization failed",
        type: "configuration-error",
        timestamp: new Date(),
      } as AuthError,
      hasError: true,
      signUp: async () => false,
      signIn: async () => false,
      signInWithGoogle: async () => false,
      signOut: async () => false,
      resetPassword: async () => false,
      updateProfile: async () => false,
      updatePassword: async () => false,
      clearError: () => {},
      validateEmail,
      validatePassword,
      session: null,
      getSessionInfo: () => null,
      isSigningIn: false,
      isSigningUp: false,
      isSigningOut: false,
      isResettingPassword: false,
      isUpdatingProfile: false,
      isUpdatingPassword: false,
      lastOperation: undefined,
      userProfile: null,
      role: null,
      permissions: DEFAULT_PERMISSIONS.user,
      isAdmin: false,
      isUser: false,
      canPerformAdminOps: false,
      refreshProfile: async () => {},
    };
  }

  // Debug semplificato
  debugLog("useAuth return state", {
    hasUser: !!state.user,
    hasAuthUser: !!state.authUser,
    isAuthenticated: !!state.user && !!state.authUser
  });

  // SOLUZIONE StrictMode: usa globalAuthState se state locale è vuoto ma global ha dati
  const effectiveUser = state.user || globalAuthState.lastUser;
  const effectiveAuthUser = state.authUser || (effectiveUser ? getCurrentAuthUser() : null);
  
  return {
    user: effectiveUser,
    authUser: effectiveAuthUser,
    isAuthenticated: !!effectiveUser && !!effectiveAuthUser,
    loading: isLoading,
    initializing: state.initializing,
    isReady,
    hasError: !!state.error,
    error: state.error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleGoogleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    verifyPasswordResetCode: handleVerifyPasswordResetCode,
    confirmPasswordReset: handleConfirmPasswordReset,
    verifyEmail: handleVerifyEmail,
    updateProfile: handleUpdateProfile,
    updatePassword: handleUpdatePassword,
    clearError,
    validateEmail,
    validatePassword,
    session: state.session,
    getSessionInfo,
    isSigningIn: state.operationLoading.signIn,
    isSigningUp: state.operationLoading.signUp,
    isSigningOut: state.operationLoading.signOut,
    isResettingPassword: state.operationLoading.resetPassword,
    isUpdatingProfile: state.operationLoading.updateProfile,
    isUpdatingPassword: state.operationLoading.updatePassword,
    lastOperation: state.lastOperation,
    userProfile: state.userProfile,
    role: state.role,
    permissions: state.permissions,
    isAdmin: isAdmin(state.userProfile),
    isUser: isUser(state.userProfile),
    canPerformAdminOps: canPerformAdminOperation(state.userProfile),
    refreshProfile: () => loadUserProfile(state.user?.id || ""),
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
