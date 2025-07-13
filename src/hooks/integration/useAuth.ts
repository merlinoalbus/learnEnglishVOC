// =====================================================
// 📁 hooks/integration/useAuth.ts - FIXED: SOLO AUTH STATE
// =====================================================

/**
 * CORREZIONE PRINCIPALE:
 * ✅ RIMOSSO tutto il codice Firestore operations
 * ✅ MANTIENE solo gestione auth state e operations
 * ✅ USA authService.ts per operazioni auth
 * ✅ INTEGRATO con FirebaseContext per auth ready state
 * ✅ TYPE-SAFE per tutto l'auth flow
 * ✅ ELIMINA responsabilità database
 *
 * RESPONSABILITÀ:
 * - Auth state management (login, logout, user corrente)
 * - Auth operations via authService
 * - Session tracking
 * - Loading states per auth operations
 * - Error handling auth-specific
 * - Integration con FirebaseContext
 */

// ===== IMPORTS =====
import { useState, useEffect, useCallback, useRef } from "react";

// Import Firebase context
import { useFirebase } from "../../contexts/FirebaseContext";

// Import auth service (FIXED - solo auth)
import {
  signUp,
  signIn,
  signOutUser,
  resetPassword,
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
} from "../../services/authService";

// Import dei types SOLO AUTH (no Firestore)
import type {
  User,
  AuthState,
  AuthError,
  SignUpInput,
  SignInInput,
  ResetPasswordInput,
  UpdateProfileInput,
  AuthOperationResult,
  UserSession,
} from "../../types/entities/User.types";

import type {
  AuthUser,
  AuthSession,
  UpdatePasswordInput,
} from "../../types/infrastructure/Auth.types";

// =====================================================
// 🔧 HOOK CONFIGURATION
// =====================================================

const AUTH_HOOK_CONFIG = {
  // Session management
  sessionUpdateInterval: 60000, // 1 minute
  sessionValidationInterval: 300000, // 5 minutes

  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,

  // Debug configuration
  enableDebugLogging: process.env.NODE_ENV === "development",
};

// =====================================================
// 🔄 UTILITY FUNCTIONS
// =====================================================

/**
 * Debug logger per auth hook
 */
const debugLog = (message: string, data?: any) => {
  if (AUTH_HOOK_CONFIG.enableDebugLogging) {
    console.log(`🔐 [useAuth] ${message}`, data || "");
  }
};

/**
 * Converte AuthError in formato consistente
 */
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

// =====================================================
// 📊 HOOK STATE INTERFACE
// =====================================================

/**
 * Stato interno hook auth
 */
interface AuthHookState {
  // Auth state
  user: User | null;
  authUser: AuthUser | null;

  // Loading states
  loading: boolean;
  initializing: boolean;

  // Operation loading states
  operationLoading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    resetPassword: boolean;
    updateProfile: boolean;
    updatePassword: boolean;
  };

  // Error state
  error: AuthError | null;

  // Session state
  session: AuthSession | null;

  // Metadata
  lastOperation?: {
    type: string;
    timestamp: Date;
    success: boolean;
  };
}

// =====================================================
// 🎯 MAIN AUTH HOOK
// =====================================================

/**
 * Hook principale per gestione autenticazione
 * RESPONSABILITÀ SOLO AUTH:
 * - User state management
 * - Auth operations (login, logout, register)
 * - Session tracking
 * - Loading states
 * - Error handling auth-specific
 */
export const useAuth = () => {
  // ===== EXTERNAL DEPENDENCIES =====

  // Firebase context per ready state
  const { isReady: firebaseReady, error: firebaseError } = useFirebase();

  // ===== STATE MANAGEMENT =====

  const [state, setState] = useState<AuthHookState>({
    user: null,
    authUser: null,
    loading: false,
    initializing: true,
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

  // ===== REFS per CLEANUP =====

  const authUnsubscribeRef = useRef<(() => void) | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // ===== HELPER FUNCTIONS =====

  /**
   * Safe state update - evita warnings su component unmounted
   */
  const safeSetState = useCallback(
    (updater: (prev: AuthHookState) => AuthHookState) => {
      if (isMountedRef.current) {
        setState(updater);
      }
    },
    []
  );

  /**
   * Set operation loading state
   */
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

  /**
   * Update last operation metadata
   */
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

  // ===== SESSION MANAGEMENT =====

  /**
   * Start session for authenticated user
   */
  const startSession = useCallback(
    (authUser: AuthUser) => {
      const session = createUserSession(authUser);

      safeSetState((prev) => ({
        ...prev,
        session,
      }));

      debugLog("Session started", { sessionId: session.sessionId });

      // Setup session update timer
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }

      sessionTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          safeSetState((prev) => {
            if (!prev.session) return prev;

            const updatedSession = updateSessionActivity(prev.session);

            // Validate session
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

  /**
   * End current session
   */
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

  // ===== AUTH OPERATIONS =====

  /**
   * SIGN UP operation
   */
  const handleSignUp = useCallback(
    async (input: SignUpInput): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for sign up");
        return false;
      }

      setOperationLoading("signUp", true);

      try {
        debugLog("Sign up attempt", { email: input.email });

        const result = await signUp({
          email: input.email,
          password: input.password,
          displayName: input.displayName,
          acceptTerms: input.acceptTerms,
        });

        if (result.success && result.user) {
          updateLastOperation("signUp", true);
          debugLog("Sign up successful");
          // Auth state listener will handle user state update
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

  /**
   * SIGN IN operation
   */
  const handleSignIn = useCallback(
    async (input: SignInInput): Promise<boolean> => {
      if (!firebaseReady) {
        debugLog("Firebase not ready for sign in");
        return false;
      }

      setOperationLoading("signIn", true);

      try {
        debugLog("Sign in attempt", { email: input.email });

        const result = await signIn({
          email: input.email,
          password: input.password,
          rememberMe: input.rememberMe,
        });

        if (result.success && result.user) {
          updateLastOperation("signIn", true);
          debugLog("Sign in successful");
          // Auth state listener will handle user state update
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

  /**
   * SIGN OUT operation
   */
  const handleSignOut = useCallback(async (): Promise<boolean> => {
    setOperationLoading("signOut", true);

    try {
      debugLog("Sign out attempt");

      const result = await signOutUser();

      if (result.success) {
        updateLastOperation("signOut", true);
        debugLog("Sign out successful");
        // Auth state listener will handle user state clear
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

  /**
   * RESET PASSWORD operation
   */
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
          debugLog("Password reset email sent");
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

  /**
   * UPDATE PROFILE operation
   */
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
        debugLog("Profile update attempt");

        const result = await updateAuthProfile(input);

        if (result.success && result.user) {
          updateLastOperation("updateProfile", true);
          debugLog("Profile update successful");
          // Auth state listener will handle user state update
          return true;
        } else {
          throw result.error || new Error("Profile update failed");
        }
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
      setOperationLoading,
      updateLastOperation,
      safeSetState,
    ]
  );

  /**
   * UPDATE PASSWORD operation
   */
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

  // ===== UTILITY FUNCTIONS =====

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    safeSetState((prev) => ({
      ...prev,
      error: null,
    }));
  }, [safeSetState]);

  /**
   * Check if user is authenticated
   */
  const checkAuthenticated = useCallback((): boolean => {
    return !!state.user && !!state.authUser;
  }, [state.user, state.authUser]);

  /**
   * Get session info
   */
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

  // ===== AUTH STATE LISTENER EFFECT =====

  /**
   * Setup auth state listener
   */
  useEffect(() => {
    if (!firebaseReady) {
      debugLog("Firebase not ready, skipping auth state listener setup");
      return;
    }

    debugLog("Setting up auth state listener");

    // Setup auth state change listener
    const unsubscribe = onAuthStateChange((user) => {
      debugLog("Auth state changed", {
        uid: user?.id || "null",
        authenticated: !!user,
      });

      if (user) {
        // User signed in
        const authUser = getCurrentAuthUser();

        safeSetState((prev) => ({
          ...prev,
          user,
          authUser,
          initializing: false,
          error: null,
        }));

        // Start session if auth user available
        if (authUser) {
          startSession(authUser);
        }
      } else {
        // User signed out
        safeSetState((prev) => ({
          ...prev,
          user: null,
          authUser: null,
          initializing: false,
        }));

        // End session
        endSession();
      }
    });

    authUnsubscribeRef.current = unsubscribe;

    return () => {
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = null;
        debugLog("Auth state listener cleaned up");
      }
    };
  }, [firebaseReady, safeSetState, startSession, endSession]);

  // ===== CLEANUP EFFECT =====

  /**
   * Cleanup al unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;

      // Cleanup auth listener
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
      }

      // Cleanup session timer
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }

      debugLog("Hook cleaned up");
    };
  }, []);

  // ===== COMPUTED VALUES =====

  const isLoading =
    state.loading ||
    state.initializing ||
    Object.values(state.operationLoading).some((loading) => loading);

  const isReady = firebaseReady && !state.initializing && !isLoading;

  // ===== ERROR FALLBACK =====

  /**
   * Handle Firebase initialization error
   */
  if (firebaseError) {
    return {
      // Auth state
      user: null,
      authUser: null,
      isAuthenticated: false,

      // Loading states
      loading: false,
      initializing: false,
      isReady: false,

      // Error state
      error: {
        code: "firebase-init-error",
        message: "Firebase initialization failed",
        type: "configuration-error",
        timestamp: new Date(),
      } as AuthError,
      hasError: true,

      // Operations (disabled)
      signUp: async () => false,
      signIn: async () => false,
      signOut: async () => false,
      resetPassword: async () => false,
      updateProfile: async () => false,
      updatePassword: async () => false,

      // Utilities (disabled)
      clearError: () => {},

      // Validation utilities (still work)
      validateEmail,
      validatePassword,

      // Session info
      session: null,
      getSessionInfo: () => null,

      // Operation states
      isSigningIn: false,
      isSigningUp: false,
      isSigningOut: false,
      isResettingPassword: false,
      isUpdatingProfile: false,
      isUpdatingPassword: false,

      // Metadata
      lastOperation: undefined,
    };
  }

  // ===== RETURN HOOK API =====

  return {
    // ===== AUTH STATE =====

    /** User corrente (entity) */
    user: state.user,

    /** Auth user corrente (infrastructure) */
    authUser: state.authUser,

    /** User autenticato */
    isAuthenticated: checkAuthenticated(),

    // ===== LOADING STATES =====

    /** Loading globale */
    loading: isLoading,

    /** Inizializzazione auth in corso */
    initializing: state.initializing,

    /** Hook pronto per uso */
    isReady,

    // ===== ERROR STATE =====

    /** Errore corrente */
    error: state.error,

    /** Ha errore attivo */
    hasError: !!state.error,

    // ===== AUTH OPERATIONS =====

    /** Registrazione nuovo utente */
    signUp: handleSignUp,

    /** Login utente esistente */
    signIn: handleSignIn,

    /** Logout utente */
    signOut: handleSignOut,

    /** Reset password via email */
    resetPassword: handleResetPassword,

    /** Aggiorna profilo utente */
    updateProfile: handleUpdateProfile,

    /** Cambia password utente */
    updatePassword: handleUpdatePassword,

    // ===== UTILITY FUNCTIONS =====

    /** Clear errore corrente */
    clearError,

    /** Validazione email */
    validateEmail,

    /** Validazione password */
    validatePassword,

    // ===== SESSION INFO =====

    /** Sessione corrente */
    session: state.session,

    /** Info sessione */
    getSessionInfo,

    // ===== OPERATION STATES =====

    /** Sign in in corso */
    isSigningIn: state.operationLoading.signIn,

    /** Sign up in corso */
    isSigningUp: state.operationLoading.signUp,

    /** Sign out in corso */
    isSigningOut: state.operationLoading.signOut,

    /** Password reset in corso */
    isResettingPassword: state.operationLoading.resetPassword,

    /** Profile update in corso */
    isUpdatingProfile: state.operationLoading.updateProfile,

    /** Password update in corso */
    isUpdatingPassword: state.operationLoading.updatePassword,

    // ===== METADATA =====

    /** Ultima operazione eseguita */
    lastOperation: state.lastOperation,
  };
};

// =====================================================
// 🔧 SPECIALIZED HOOKS
// =====================================================

/**
 * Hook per solo auth state (no operations)
 */
export const useAuthState = () => {
  const {
    user,
    authUser,
    isAuthenticated,
    loading,
    initializing,
    isReady,
    error,
  } = useAuth();

  return {
    user,
    authUser,
    isAuthenticated,
    loading,
    initializing,
    isReady,
    error,
    hasError: !!error,
  };
};

/**
 * Hook per solo auth operations (no state)
 */
export const useAuthOperations = () => {
  const {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    clearError,
    validateEmail,
    validatePassword,
    isSigningIn,
    isSigningUp,
    isSigningOut,
    isResettingPassword,
    isUpdatingProfile,
    isUpdatingPassword,
  } = useAuth();

  return {
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
    clearError,
    validateEmail,
    validatePassword,
    isSigningIn,
    isSigningUp,
    isSigningOut,
    isResettingPassword,
    isUpdatingProfile,
    isUpdatingPassword,
  };
};

/**
 * Hook per user info corrente
 */
export const useCurrentUser = () => {
  const { user, authUser, isAuthenticated, session } = useAuth();

  return {
    user,
    authUser,
    isAuthenticated,
    session,
    userId: user?.id || null,
    email: user?.email || null,
    displayName: user?.displayName || null,
    emailVerified: user?.emailVerified || false,
  };
};

// =====================================================
// 📝 EXPORT SUMMARY
// =====================================================

/**
 * HOOKS AUTH ESPORTATI:
 *
 * 🎯 Main Hook:
 * - useAuth() → Complete auth management
 *
 * 🔧 Specialized Hooks:
 * - useAuthState() → Solo stato auth
 * - useAuthOperations() → Solo operazioni auth
 * - useCurrentUser() → Info user corrente
 *
 * FEATURES PRINCIPALI:
 * ✅ Type-safe per tutti gli auth types
 * ✅ Session management automatico
 * ✅ Loading states granulari per ogni operazione
 * ✅ Error handling tipizzato
 * ✅ Auto-cleanup listeners e timers
 * ✅ Integration con FirebaseContext
 * ✅ Validation utilities
 * ✅ Auth state monitoring real-time
 *
 * RESPONSABILITÀ SOLO AUTH:
 * ✅ User authentication state
 * ✅ Auth operations (login, logout, register)
 * ✅ Session tracking e validation
 * ✅ Password management
 * ✅ Profile management (AUTH data only)
 *
 * INTEGRA CON:
 * ✅ authService.ts per operations
 * ✅ FirebaseContext per ready state
 * ✅ User.types.ts e Auth.types.ts per types
 *
 * RIMOSSO:
 * ❌ Operazioni Firestore (ora in useFirestore)
 * ❌ Database operations
 * ❌ Document management
 * ❌ Real-time listeners Firestore
 */
