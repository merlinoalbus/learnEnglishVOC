// =====================================================
// 📁 src/config/firebase.ts - Firebase Configuration TypeScript
// =====================================================

/**
 * FIREBASE SETUP TypeScript per Vocabulary Master
 * ✅ Type-safe integration con types definiti
 * ✅ Configurazione da environment variables
 * ✅ Inizializzazione Firestore + Auth
 * ✅ Error handling con FirestoreError types
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  setPersistence,
  browserLocalPersistence,
  type Auth,
} from "firebase/auth";

// Import dei types definiti
import type {
  FirestoreCollectionName,
  FirestoreError,
} from "../types/infrastructure/Firestore.types";

// =====================================================
// 🔧 FIREBASE CONFIGURATION
// =====================================================

/**
 * Firebase config da environment variables
 * Type-safe con validazione
 */
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY!,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.REACT_APP_FIREBASE_APP_ID!,
};

/**
 * Validazione configurazione Firebase
 * Type-safe validation con detailed error messages
 */
function validateFirebaseConfig(): void {
  const requiredFields: (keyof FirebaseConfig)[] = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];

  const missingFields = requiredFields.filter(
    (field) => !firebaseConfig[field]
  );

  if (missingFields.length > 0) {
    throw new Error(
      `❌ Firebase configuration incomplete. Missing: ${missingFields.join(
        ", "
      )}\n` +
        `Please check your .env file and ensure all REACT_APP_FIREBASE_* variables are set.`
    );
  }

}

// =====================================================
// 🚀 FIREBASE INITIALIZATION
// =====================================================

// Validazione prima dell'inizializzazione
validateFirebaseConfig();

/**
 * Initialize Firebase App
 * Type-safe Firebase app instance
 */
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Initialize secondary Firebase App for admin operations
 * This prevents session interference during user creation
 */
export const adminFirebaseApp: FirebaseApp = initializeApp(firebaseConfig, "admin");

/**
 * Initialize Firestore with types and persistence
 * Type-safe Firestore instance with multi-tab support
 */
export const db: Firestore = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

/**
 * Initialize Auth with types
 * Type-safe Auth instance
 */
export const auth: Auth = getAuth(firebaseApp);

/**
 * Initialize secondary Auth instance for admin operations
 * This prevents session interference during user creation
 */
export const adminAuth: Auth = getAuth(adminFirebaseApp);


// =====================================================
// 🔧 SETUP & PERSISTENCE
// =====================================================


/**
 * Setup Auth persistence
 * Type-safe auth persistence setup
 */
async function setupAuthPersistence(): Promise<boolean> {
  try {
    await setPersistence(auth, browserLocalPersistence);
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to enable Auth persistence:", error);
    return false;
  }
}

/**
 * Setup development emulators
 * Type-safe emulator connection
 */
async function setupDevelopment(): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    try {
      // Firestore Emulator (opzionale)
      if (process.env.REACT_APP_USE_FIRESTORE_EMULATOR === "true") {
        connectFirestoreEmulator(db, "localhost", 8080);
        console.log("🔧 Connected to Firestore Emulator");
      }

      // Auth Emulator (opzionale)
      if (process.env.REACT_APP_USE_AUTH_EMULATOR === "true") {
        connectAuthEmulator(auth, "http://localhost:9099");
        console.log("🔧 Connected to Auth Emulator");
      }

    } catch (error) {
      console.warn(
        "⚠️ Emulator connection failed (normal if not running):",
        error
      );
    }
  }
}

// =====================================================
// 🚀 INITIALIZATION FUNCTION
// =====================================================

/**
 * Firebase initialization result
 * Type-safe result object
 */
export interface FirebaseInitResult {
  success: boolean;
  firestorePersistence: boolean;
  authPersistence: boolean;
  error?: Error;
}

/**
 * Initialize Firebase completo
 * Type-safe initialization con detailed result
 */
export async function initializeFirebase(): Promise<FirebaseInitResult> {
  try {
  
    // Setup in sequenza
    await setupDevelopment();

    const authPersistence = await setupAuthPersistence();

    return {
      success: true,
      firestorePersistence: true, // Always true now with new API
      authPersistence,
    };
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);

    return {
      success: false,
      firestorePersistence: false,
      authPersistence: false,
      error: error as Error,
    };
  }
}

// =====================================================
// 📊 FIRESTORE COLLECTIONS
// =====================================================

/**
 * Collections names - Type-safe constants
 * Integrati con FirestoreCollectionName type
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: "users",
  WORDS: "words",
  TESTS: "tests",
  STATISTICS: "statistics",
  PERFORMANCE: "performance",
  USER_PROFILES: "user_profiles",
  USER_PREFERENCES: "user_preferences",
} as const;

// Type guard per collection names
export function isValidCollectionName(
  name: string
): name is FirestoreCollectionName {
  return Object.values(FIRESTORE_COLLECTIONS).includes(
    name as FirestoreCollectionName
  );
}

/**
 * Helper per path user-scoped type-safe
 * SECURITY: Tutti i document sono user-scoped
 */
export function getUserDocPath(
  collection: FirestoreCollectionName,
  userId: string,
  docId?: string
): string {
  const basePath = `${collection}/${userId}`;
  return docId ? `${basePath}/${docId}` : basePath;
}

/**
 * Helper per path subcollection user-scoped
 * Type-safe subcollection paths
 */
export function getUserSubcollectionPath(
  collection: FirestoreCollectionName,
  userId: string,
  subcollection: string,
  docId?: string
): string {
  const basePath = `${collection}/${userId}/${subcollection}`;
  return docId ? `${basePath}/${docId}` : basePath;
}

// =====================================================
// 🔍 UTILITIES & STATUS
// =====================================================

/**
 * Firebase status interface
 * Type-safe status object
 */
export interface FirebaseStatus {
  app: {
    name: string;
    options: Record<string, any>;
  };
  firestore: {
    app: string;
  };
  auth: {
    app: string;
    currentUser: {
      uid: string;
      email: string | null;
      emailVerified: boolean;
    } | null;
  };
}

/**
 * Firebase status per debugging
 * Type-safe status retrieval
 */
export function getFirebaseStatus(): FirebaseStatus {
  return {
    app: {
      name: firebaseApp.name,
      options: firebaseApp.options,
    },
    firestore: {
      app: db.app.name,
    },
    auth: {
      app: auth.app.name,
      currentUser: auth.currentUser
        ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified,
          }
        : null,
    },
  };
}

/**
 * Check online status
 * Type-safe online check
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Create type-safe FirestoreError
 * Helper per creare errori Firestore type-safe
 */
export function createFirestoreError(
  code: string,
  message: string,
  operation: string,
  path?: string
): FirestoreError {
  return {
    code: code as any, // Cast per compatibility con FirestoreErrorCode
    message,
    operation: operation as any, // Cast per compatibility con FirestoreOperation
    path,
    recoverable: code !== "permission-denied" && code !== "unauthenticated",
    timestamp: new Date(),
  };
}

// =====================================================
// 📋 TYPE-SAFE EXPORTS
// =====================================================

// Re-export Firebase types for convenience
export type { FirebaseApp } from "firebase/app";
export type { Firestore } from "firebase/firestore";
export type { Auth } from "firebase/auth";

export type {
  User as FirebaseUser,
  UserCredential,
  AuthError as FirebaseAuthError,
} from "firebase/auth";

export type {
  DocumentData,
  DocumentReference,
  CollectionReference,
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  FirestoreError as FirebaseFirestoreError,
} from "firebase/firestore";

export default firebaseApp;
