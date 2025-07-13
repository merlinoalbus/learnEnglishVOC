// =====================================================
// 📁 services/authService.ts - FIXED: SOLO AUTENTICAZIONE
// =====================================================

// ===== IMPORTS =====
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser,
  type UserCredential,
  type AuthError as FirebaseAuthError,
} from "firebase/auth";

// Import Firebase instances
import { auth } from "../config/firebase";

// Import dei types corretti
import type {
  AuthUser,
  AuthOperationResult,
  AuthError,
  AuthSession,
  SignInWithEmailInput,
  SignUpWithEmailInput,
  ResetPasswordInput,
  UpdateProfileInput,
  UpdatePasswordInput,
} from "../types/infrastructure/Auth.types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db } from "../config/firebase";
import {
  UserRole,
  UserPermissions,
  AdminOperation,
  UserManagementFilters,
  UserExportData,
  DEFAULT_PERMISSIONS,
} from "../types/entities/User.types";

import type {
  User,
  AuthState,
  SignUpInput,
  SignInInput,
  AuthOperationResult as UserAuthOperationResult,
} from "../types/entities/User.types";
export const getUserProfile = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      ...data,
      id: userDoc.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate(),
    } as User;
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw new Error("Failed to get user profile");
  }
};

export const initializeUserProfile = async (
  authUser: User,
  registrationMethod: "email" | "google" = "email",
  isNewUser: boolean = true
): Promise<User> => {
  try {
    const userProfileRef = doc(db, USERS_COLLECTION, authUser.id);

    // Check if profile already exists
    const existingProfile = await getDoc(userProfileRef);

    if (existingProfile.exists() && !isNewUser) {
      // Update last login time for existing users
      await setDoc(
        userProfileRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      const profileData = existingProfile.data() as User;
      return {
        ...profileData,
        id: authUser.id,
        lastLoginAt: new Date(),
      };
    }

    // Create new profile for new users
    const defaultRole: UserRole = "user";

    // Check if this is the first user (should be admin)
    const isFirstUser = await checkIfFirstUser();
    const role: UserRole = isFirstUser ? "admin" : defaultRole;

    const newProfile: Partial<User> = {
      id: authUser.id,
      email: authUser.email,
      displayName: authUser.displayName || undefined,
      photoURL: authUser.photoURL || undefined,
      emailVerified: authUser.emailVerified,
      providerId: authUser.providerId,
      role,
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      metadata: {
        registrationMethod,
        notes: isNewUser ? "Auto-created profile" : undefined,
      },
    };

    // Save to Firestore
    await setDoc(userProfileRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    return newProfile as User;
  } catch (error) {
    console.error("Error initializing user profile:", error);
    throw new Error("Failed to initialize user profile");
  }
};
export const getAllUsers = async (
  filters?: UserManagementFilters
): Promise<User[]> => {
  try {
    let q = query(
      collection(db, USERS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    // Apply filters
    if (filters?.role) {
      q = query(q, where("role", "==", filters.role));
    }
    if (filters?.isActive !== undefined) {
      q = query(q, where("isActive", "==", filters.isActive));
    }
    if (filters?.emailVerified !== undefined) {
      q = query(q, where("emailVerified", "==", filters.emailVerified));
    }

    const snapshot = await getDocs(q);

    let users = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      lastLoginAt: doc.data().lastLoginAt?.toDate(),
    })) as User[];

    // Apply client-side filters
    if (filters?.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      users = users.filter(
        (user) =>
          user.email.toLowerCase().includes(term) ||
          user.displayName?.toLowerCase().includes(term) ||
          user.id.includes(term)
      );
    }

    return users;
  } catch (error) {
    console.error("Error getting all users:", error);
    throw new Error("Failed to get users");
  }
};

export const toggleUserStatus = async (
  userId: string,
  isActive: boolean,
  adminId: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // Update user status
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.update(userRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });

    // Log admin operation
    const operationRef = doc(collection(db, ADMIN_OPERATIONS_COLLECTION));
    const operation: AdminOperation = {
      type: isActive ? "unblock_user" : "block_user",
      targetUserId: userId,
      performedBy: adminId,
      timestamp: new Date(),
      metadata: { isActive },
    };
    batch.set(operationRef, {
      ...operation,
      timestamp: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error toggling user status:", error);
    return false;
  }
};

export const resetUserPassword = async (
  userEmail: string,
  adminId: string
): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, userEmail);

    // Log admin operation
    const operationRef = doc(collection(db, ADMIN_OPERATIONS_COLLECTION));
    const operation: AdminOperation = {
      type: "password_reset",
      targetUserId: userEmail,
      performedBy: adminId,
      timestamp: new Date(),
      metadata: { email: userEmail },
    };
    await setDoc(operationRef, {
      ...operation,
      timestamp: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error sending password reset:", error);
    return false;
  }
};

export const deleteUserData = async (
  userId: string,
  adminId: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // Delete user profile
    const userRef = doc(db, USERS_COLLECTION, userId);
    batch.delete(userRef);

    // Delete user's data collections
    const userDataCollections = ["words", "test_history", "statistics"];

    for (const collectionName of userDataCollections) {
      const userDataQuery = query(
        collection(db, collectionName),
        where("userId", "==", userId)
      );
      const userDataSnapshot = await getDocs(userDataQuery);

      userDataSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Log admin operation
    const operationRef = doc(collection(db, ADMIN_OPERATIONS_COLLECTION));
    const operation: AdminOperation = {
      type: "delete_user",
      targetUserId: userId,
      performedBy: adminId,
      timestamp: new Date(),
    };
    batch.set(operationRef, {
      ...operation,
      timestamp: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

export const exportUserData = async (
  userId: string,
  adminId: string
): Promise<UserExportData | null> => {
  try {
    // Get user profile
    const userProfile = await getUserProfile(userId);
    if (!userProfile) {
      throw new Error("User not found");
    }

    // Get user's data from collections
    const collections = ["words", "test_history", "statistics"];
    const userData: Record<string, any[]> = {};

    for (const collectionName of collections) {
      const userDataQuery = query(
        collection(db, collectionName),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(userDataQuery);
      userData[collectionName] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    const exportData: UserExportData = {
      profile: userProfile,
      words: userData.words || [],
      testHistory: userData.test_history || [],
      statistics: userData.statistics || [],
      exportedAt: new Date(),
      exportedBy: adminId,
    };

    // Log admin operation
    const operationRef = doc(collection(db, ADMIN_OPERATIONS_COLLECTION));
    const operation: AdminOperation = {
      type: "export_data",
      targetUserId: userId,
      performedBy: adminId,
      timestamp: new Date(),
      metadata: {
        wordsCount: exportData.words.length,
        testHistoryCount: exportData.testHistory.length,
        statisticsCount: exportData.statistics.length,
      },
    };
    await setDoc(operationRef, {
      ...operation,
      timestamp: serverTimestamp(),
    });

    return exportData;
  } catch (error) {
    console.error("Error exporting user data:", error);
    return null;
  }
};

export const importUserData = async (
  userId: string,
  importData: Partial<UserExportData>,
  adminId: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);

    // Import data to collections
    const collections = {
      words: importData.words || [],
      test_history: importData.testHistory || [],
      statistics: importData.statistics || [],
    };

    for (const [collectionName, items] of Object.entries(collections)) {
      items.forEach((item: any) => {
        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, {
          ...item,
          userId,
          importedAt: serverTimestamp(),
        });
      });
    }

    // Log admin operation
    const operationRef = doc(collection(db, ADMIN_OPERATIONS_COLLECTION));
    const operation: AdminOperation = {
      type: "import_data",
      targetUserId: userId,
      performedBy: adminId,
      timestamp: new Date(),
      metadata: {
        wordsCount: collections.words.length,
        testHistoryCount: collections.test_history.length,
        statisticsCount: collections.statistics.length,
      },
    };
    batch.set(operationRef, {
      ...operation,
      timestamp: serverTimestamp(),
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error importing user data:", error);
    return false;
  }
};

export const getAdminOperations = async (
  limit_count: number = 50
): Promise<AdminOperation[]> => {
  try {
    const q = query(
      collection(db, ADMIN_OPERATIONS_COLLECTION),
      orderBy("timestamp", "desc")
      // Note: limit() would go here but we'll handle it client-side for now
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.slice(0, limit_count).map((doc) => ({
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as AdminOperation[];
  } catch (error) {
    console.error("Error getting admin operations:", error);
    throw new Error("Failed to get admin operations");
  }
};
export const checkIfFirstUser = async (): Promise<boolean> => {
  try {
    const usersQuery = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(usersQuery);
    return snapshot.size === 0;
  } catch (error) {
    console.error("Error checking if first user:", error);
    return false;
  }
};
// =====================================================
// 🔧 SERVICE CONFIGURATION
// =====================================================
const USERS_COLLECTION = "users";
const ADMIN_OPERATIONS_COLLECTION = "admin_operations";

const AUTH_SERVICE_CONFIG = {
  // Session configuration
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours

  // Security configuration
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes

  // Monitoring configuration
  enableSessionTracking: true,
  enableSecurityLogging: process.env.NODE_ENV === "development",
};

// =====================================================
// 🔄 UTILITY FUNCTIONS
// =====================================================

/**
 * Debug logger per auth operations
 */
const debugLog = (message: string, data?: any) => {
  if (AUTH_SERVICE_CONFIG.enableSecurityLogging) {
    console.log(`🔐 [AuthService] ${message}`, data || "");
  }
};

/**
 * Converte Firebase User in AuthUser type
 */
const convertFirebaseUser = (firebaseUser: FirebaseUser): AuthUser => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    phoneNumber: firebaseUser.phoneNumber,
    emailVerified: firebaseUser.emailVerified,
    isAnonymous: firebaseUser.isAnonymous,
    metadata: {
      creationTime: new Date(firebaseUser.metadata.creationTime!),
      lastSignInTime: new Date(firebaseUser.metadata.lastSignInTime!),
    },
    providerData: firebaseUser.providerData.map((provider) => ({
      providerId: provider.providerId,
      uid: provider.uid,
      email: provider.email,
      displayName: provider.displayName,
      photoURL: provider.photoURL,
      phoneNumber: provider.phoneNumber,
    })),
  };
};

/**
 * Converte Firebase AuthUser in User entity
 */
const convertToUserEntity = (authUser: AuthUser): User => {
  return {
    id: authUser.uid,
    email: authUser.email || "",
    displayName: authUser.displayName || undefined,
    photoURL: authUser.photoURL || undefined,
    emailVerified: authUser.emailVerified,
    providerId: authUser.providerData[0]?.providerId || "email",
    createdAt: authUser.metadata.creationTime,
    lastLoginAt: authUser.metadata.lastSignInTime,
    role: "user" as UserRole, // AGGIUNGI
    isActive: true,
  };
};

/**
 * Converte Firebase AuthError nei nostri types
 */
const convertAuthError = (
  firebaseError: FirebaseAuthError,
  operation: string
): AuthError => {
  // Mapping codici errore comuni
  const getErrorType = (code: string) => {
    switch (code) {
      case "auth/network-request-failed":
        return "network-error";
      case "auth/invalid-email":
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "invalid-credentials";
      case "auth/email-already-in-use":
      case "auth/weak-password":
        return "user-management";
      case "auth/too-many-requests":
        return "rate-limited";
      default:
        return "unknown";
    }
  };

  return {
    code: firebaseError.code,
    message: firebaseError.message,
    operation: operation as any,
    recoverable: ["network-error", "rate-limited"].includes(
      getErrorType(firebaseError.code)
    ),
    timestamp: new Date(),
    type: getErrorType(firebaseError.code),
  };
};

/**
 * Crea AuthOperationResult standard
 */
const createOperationResult = (
  success: boolean,
  user?: AuthUser,
  error?: AuthError,
  message?: string
): AuthOperationResult => {
  return {
    success,
    user,
    error,
    message,
    metadata: {
      timestamp: new Date(),
      duration: 0, // Will be set by calling function
    },
  };
};

// =====================================================
// 🔐 CORE AUTH OPERATIONS
// =====================================================

/**
 * SIGN UP - Registrazione nuovo utente
 */
export const signUp = async (
  input: SignUpWithEmailInput
): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    debugLog("Sign up attempt", { email: input.email });

    // Crea utente con Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );

    // Aggiorna profilo se displayName fornito
    if (input.displayName) {
      await updateProfile(userCredential.user, {
        displayName: input.displayName,
      });
    }

    // Converte in AuthUser
    const authUser = convertFirebaseUser(userCredential.user);

    debugLog("Sign up successful", { uid: authUser.uid });

    const result = createOperationResult(
      true,
      authUser,
      undefined,
      "Account creato con successo"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Sign up failed", error);

    const authError = convertAuthError(error as FirebaseAuthError, "sign-up");

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

/**
 * SIGN IN - Login utente esistente
 */
export const signIn = async (
  input: SignInWithEmailInput
): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    debugLog("Sign in attempt", { email: input.email });

    // Login con Firebase Auth
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );

    // Converte in AuthUser
    const authUser = convertFirebaseUser(userCredential.user);

    debugLog("Sign in successful", { uid: authUser.uid });

    const result = createOperationResult(
      true,
      authUser,
      undefined,
      "Login effettuato con successo"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Sign in failed", error);

    const authError = convertAuthError(error as FirebaseAuthError, "sign-in");

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

/**
 * SIGN OUT - Logout utente
 */
export const signOutUser = async (): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    const currentUser = auth.currentUser;
    debugLog("Sign out attempt", { uid: currentUser?.uid });

    await signOut(auth);

    debugLog("Sign out successful");

    const result = createOperationResult(
      true,
      undefined,
      undefined,
      "Logout effettuato con successo"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Sign out failed", error);

    const authError = convertAuthError(error as FirebaseAuthError, "sign-out");

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

/**
 * RESET PASSWORD - Invia email reset password
 */
export const resetPassword = async (
  input: ResetPasswordInput
): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    debugLog("Password reset attempt", { email: input.email });

    await sendPasswordResetEmail(auth, input.email);

    debugLog("Password reset email sent");

    const result = createOperationResult(
      true,
      undefined,
      undefined,
      "Email di reset password inviata"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Password reset failed", error);

    const authError = convertAuthError(
      error as FirebaseAuthError,
      "password-reset"
    );

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

/**
 * UPDATE PROFILE - Aggiorna profilo AUTH (solo Firebase Auth data)
 */
export const updateAuthProfile = async (
  input: UpdateProfileInput
): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    debugLog("Profile update attempt", { uid: currentUser.uid });

    // Aggiorna profilo Firebase Auth
    const updateData: { displayName?: string; photoURL?: string } = {};

    if (input.displayName !== undefined) {
      updateData.displayName = input.displayName;
    }

    if (input.photoURL !== undefined) {
      updateData.photoURL = input.photoURL;
    }

    if (Object.keys(updateData).length > 0) {
      await updateProfile(currentUser, updateData);
    }

    // Converte updated user
    const authUser = convertFirebaseUser(currentUser);

    debugLog("Profile update successful");

    const result = createOperationResult(
      true,
      authUser,
      undefined,
      "Profilo aggiornato con successo"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Profile update failed", error);

    const authError = convertAuthError(
      error as FirebaseAuthError,
      "profile-update"
    );

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

/**
 * UPDATE PASSWORD - Cambia password utente
 */
export const updateUserPassword = async (
  input: UpdatePasswordInput
): Promise<AuthOperationResult> => {
  const startTime = Date.now();

  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("User not authenticated or email missing");
    }

    debugLog("Password update attempt");

    // Re-authenticate prima del cambio password
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      input.currentPassword
    );

    await reauthenticateWithCredential(currentUser, credential);

    // Aggiorna password
    await updatePassword(currentUser, input.newPassword);

    debugLog("Password update successful");

    const result = createOperationResult(
      true,
      convertFirebaseUser(currentUser),
      undefined,
      "Password aggiornata con successo"
    );
    result.metadata.duration = Date.now() - startTime;

    return result;
  } catch (error) {
    debugLog("Password update failed", error);

    const authError = convertAuthError(
      error as FirebaseAuthError,
      "password-update"
    );

    const result = createOperationResult(false, undefined, authError);
    result.metadata.duration = Date.now() - startTime;

    return result;
  }
};

// =====================================================
// 👥 USER STATE MANAGEMENT
// =====================================================

/**
 * GET CURRENT USER - Ottiene utente corrente auth
 */
export const getCurrentAuthUser = (): AuthUser | null => {
  const currentUser = auth.currentUser;
  return currentUser ? convertFirebaseUser(currentUser) : null;
};

/**
 * GET CURRENT USER ENTITY - Converte in User entity
 */
export const getCurrentUser = (): User | null => {
  const authUser = getCurrentAuthUser();
  return authUser ? convertToUserEntity(authUser) : null;
};

/**
 * IS AUTHENTICATED - Check se utente autenticato
 */
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

/**
 * WAIT FOR AUTH READY - Attende inizializzazione auth
 */
export const waitForAuthReady = (): Promise<AuthUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user ? convertFirebaseUser(user) : null);
    });
  });
};

// =====================================================
// 📊 SESSION MANAGEMENT
// =====================================================

/**
 * CREATE SESSION - Crea sessione utente
 */
export const createUserSession = (authUser: AuthUser): AuthSession => {
  const session: AuthSession = {
    sessionId: `session_${authUser.uid}_${Date.now()}`,
    startedAt: new Date(),
    lastActivityAt: new Date(),
    duration: 0,
    deviceInfo: {
      type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent)
        ? "mobile"
        : "desktop",
      os: navigator.platform,
      browser:
        navigator.userAgent
          .split(" ")
          .find((part) => part.includes("/"))
          ?.split("/")[0] || "unknown",
      browserVersion:
        navigator.userAgent
          .split(" ")
          .find((part) => part.includes("/"))
          ?.split("/")[1] || "unknown",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    },
    isActive: true,
  };

  debugLog("Session created", { sessionId: session.sessionId });
  return session;
};

/**
 * UPDATE SESSION ACTIVITY - Aggiorna attività sessione
 */
export const updateSessionActivity = (session: AuthSession): AuthSession => {
  const updatedSession = {
    ...session,
    lastActivityAt: new Date(),
    duration: Date.now() - session.startedAt.getTime(),
  };

  if (AUTH_SERVICE_CONFIG.enableSessionTracking) {
    debugLog("Session activity updated", { sessionId: session.sessionId });
  }

  return updatedSession;
};

/**
 * VALIDATE SESSION - Verifica validità sessione
 */
export const validateSession = (session: AuthSession): boolean => {
  const now = Date.now();
  const sessionAge = now - session.startedAt.getTime();
  const inactivityTime = now - session.lastActivityAt.getTime();

  // Check session timeout
  if (sessionAge > AUTH_SERVICE_CONFIG.sessionTimeout) {
    debugLog("Session expired (timeout)", { sessionId: session.sessionId });
    return false;
  }

  // Check inactivity timeout
  if (inactivityTime > AUTH_SERVICE_CONFIG.inactivityTimeout) {
    debugLog("Session expired (inactivity)", { sessionId: session.sessionId });
    return false;
  }

  return true;
};

// =====================================================
// 👂 AUTH STATE LISTENER
// =====================================================

/**
 * AUTH STATE LISTENER - Monitor cambiamenti auth state
 */
export const onAuthStateChange = (
  callback: (user: User | null) => void
): (() => void) => {
  debugLog("Setting up auth state listener");

  const unsubscribe = onAuthStateChanged(
    auth,
    (firebaseUser) => {
      const user = firebaseUser
        ? convertToUserEntity(convertFirebaseUser(firebaseUser))
        : null;

      debugLog("Auth state changed", {
        uid: user?.id || "null",
        authenticated: !!user,
      });

      callback(user);
    },
    (error) => {
      debugLog("Auth state error", error);
      callback(null);
    }
  );

  return () => {
    debugLog("Auth state listener cleaned up");
    unsubscribe();
  };
};

// =====================================================
// 🔧 UTILITY FUNCTIONS
// =====================================================

/**
 * GET AUTH SERVICE STATUS - Info debugging
 */
export const getAuthServiceStatus = () => {
  const currentUser = getCurrentAuthUser();

  return {
    isReady: true,
    currentUser: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          emailVerified: currentUser.emailVerified,
        }
      : null,
    config: AUTH_SERVICE_CONFIG,
    timestamp: new Date().toISOString(),
  };
};

/**
 * VALIDATE EMAIL FORMAT
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * VALIDATE PASSWORD STRENGTH
 */
export const validatePassword = (
  password: string
): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push("Password deve essere di almeno 6 caratteri");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password deve contenere almeno una lettera maiuscola");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password deve contenere almeno una lettera minuscola");
  }

  if (!/\d/.test(password)) {
    errors.push("Password deve contenere almeno un numero");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// =====================================================
// 📝 EXPORT SUMMARY
// =====================================================

/**
 * FUNZIONI AUTH ESPORTATE:
 *
 * 🔐 Core Auth Operations:
 * - signUp(input) → Registrazione nuovo utente
 * - signIn(input) → Login utente esistente
 * - signOutUser() → Logout utente
 * - resetPassword(input) → Reset password via email
 * - updateAuthProfile(input) → Aggiorna profilo auth
 * - updateUserPassword(input) → Cambia password
 *
 * 👥 User State Management:
 * - getCurrentAuthUser() → AuthUser corrente
 * - getCurrentUser() → User entity corrente
 * - isAuthenticated() → Check autenticazione
 * - waitForAuthReady() → Attende inizializzazione
 *
 * 📊 Session Management:
 * - createUserSession(authUser) → Crea sessione
 * - updateSessionActivity(session) → Aggiorna attività
 * - validateSession(session) → Valida sessione
 *
 * 👂 State Monitoring:
 * - onAuthStateChange(callback) → Listener state changes
 *
 * 🔧 Utilities:
 * - getAuthServiceStatus() → Debug info
 * - validateEmail(email) → Validazione email
 * - validatePassword(password) → Validazione password
 *
 * INTEGRAZIONE:
 * ✅ Compatible con useAuth hook
 * ✅ Type-safe con User.types.ts e Auth.types.ts
 * ✅ NO operazioni Firestore (spostate in firestoreService)
 * ✅ SOLO responsabilità autenticazione
 */
