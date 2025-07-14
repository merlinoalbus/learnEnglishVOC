import { useState, useEffect, useRef, useCallback } from "react";
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
  getUserProfile,
  initializeUserProfile,
} from "../../services/authService";

const AUTH_HOOK_CONFIG = {
  sessionUpdateInterval: 60000,
  sessionValidationInterval: 300000,
  maxRetries: 3,
  retryDelay: 1000,
  enableDebugLogging: process.env.NODE_ENV === "development",
  strictModeTimeout: 2000, // Timeout for StrictMode double mounting
};

const debugLog = (message: string, data?: any) => {
  if (AUTH_HOOK_CONFIG.enableDebugLogging) {
    console.log(`🔐 [useAuth] ${message}`, data || "");
  }
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
} = {
  isListenerSetup: false,
  lastUser: null,
  initializationComplete: false,
};

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
      if (isMountedRef.current) {
        setState(updater);
      }
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

    const unsubscribe = onAuthStateChange((user) => {
      debugLog("🚨 Auth state changed", {
        uid: user?.id || "null",
        authenticated: !!user,
        email: user?.email,
      });

      // Update global state
      globalAuthState.lastUser = user;
      globalAuthState.initializationComplete = true;

      if (user) {
        const authUser = getCurrentAuthUser();
        debugLog("User authenticated, getting authUser", { authUser });

        safeSetState((prev) => ({
          ...prev,
          user,
          authUser,
          initializing: false,
          error: null,
        }));

        if (authUser) {
          startSession(authUser);
          loadUserProfile(user.id);
        }
      } else {
        debugLog("User not authenticated, clearing state");
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

    return () => {
      clearTimeout(safetyTimeout);
      if (authUnsubscribeRef.current) {
        authUnsubscribeRef.current();
        authUnsubscribeRef.current = null;
        globalAuthState.isListenerSetup = false;
        hasSetupListenerRef.current = false;
        debugLog("Auth state listener cleaned up");
      }
    };
  }, [firebaseReady, safeSetState, startSession, endSession, loadUserProfile]);

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
    return !!state.user && !!state.authUser;
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

  return {
    user: state.user,
    authUser: state.authUser,
    isAuthenticated: checkAuthenticated(),
    loading: isLoading,
    initializing: state.initializing,
    isReady,
    hasError: !!state.error,
    error: state.error,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
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
