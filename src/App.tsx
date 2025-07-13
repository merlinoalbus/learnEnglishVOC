// =====================================================
// 📁 src/App.tsx - FIREBASE INTEGRATION TypeScript
// =====================================================

/**
 * AGGIORNAMENTO App.tsx per Firebase TypeScript
 * ✅ Integrazione FirebaseProvider type-safe nel provider chain
 * ✅ Mantiene architettura esistente intatta
 * ✅ Solo aggiunta di un livello Provider
 * ✅ Zero breaking changes
 * ✅ Type-safe throughout
 */

import React from "react";

// ESISTENTI - mantieni tutto come prima
import { AppProvider } from "./contexts/AppContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AppLayout } from "./layouts/AppLayout";
import { AppRouter } from "./routing/AppRouter";
import {
  ErrorTracker,
  MainAppErrorBoundary,
} from "./components/ErrorBoundaries";

// 🔥 NUOVA AGGIUNTA - Firebase Provider TypeScript
import { FirebaseProvider } from "./contexts/FirebaseContext";

// =====================================================
// 📊 TYPES
// =====================================================

/**
 * App Error Handler Props
 * Type-safe props for error handling
 */
interface AppErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

// =====================================================
// COMPONENTE PRINCIPALE - TypeScript
// =====================================================

/**
 * VocabularyApp - TypeScript component con Firebase
 * NUOVO LIVELLO: FirebaseProvider dopo NotificationProvider
 * ARCHITETTURA: ErrorBoundary → Notification → Firebase → App → Layout → Router
 */
const VocabularyApp: React.FC = () => {
  // =====================================================
  // 🔧 ERROR HANDLER TYPE-SAFE
  // =====================================================

  const handleAppError = (error: Error, errorInfo: AppErrorInfo): void => {
    // Error tracking esistente - INVARIATO ma type-safe
    ErrorTracker.logError(error, "Main App", { errorInfo });

    if (process.env.NODE_ENV === "development") {
      console.group("🚨 Main App Error Caught");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.groupEnd();
    }
  };

  // =====================================================
  // 🎁 JSX RETURN TYPE-SAFE
  // =====================================================

  return (
    // =====================================================
    // ERROR BOUNDARY - Livello 1 (INVARIATO ma type-safe)
    // =====================================================
    <MainAppErrorBoundary onAppError={handleAppError}>
      {/* =====================================================
          NOTIFICATION PROVIDER - Livello 2 (INVARIATO)
          ===================================================== */}
      <NotificationProvider>
        {/* =====================================================
            🔥 FIREBASE PROVIDER - Livello 3 (NUOVO TypeScript)
            ===================================================== */}
        {/**
         * FirebaseProvider - NUOVO LIVELLO TypeScript
         * RESPONSABILITÀ:
         * - Inizializza Firebase all'avvio (type-safe)
         * - Gestisce loading/error states tipizzati
         * - Fornisce Firebase status type-safe ai componenti figli
         * - Si integra con ErrorTracker esistente
         *
         * POSIZIONE:
         * - Dopo NotificationProvider (può mostrare notifiche)
         * - Prima di AppProvider (AppProvider può usare Firebase)
         * - Dentro ErrorBoundary (errori Firebase catturati)
         *
         * TYPE SAFETY:
         * - FirebaseContextValue completamente tipizzato
         * - Error handling con Error types
         * - State management type-safe
         */}
        <FirebaseProvider>
          {/* =====================================================
              APP PROVIDER - Livello 4 (INVARIATO)
              ===================================================== */}
          {/**
           * AppProvider - ESISTENTE, nessuna modifica
           * ORA può accedere a Firebase tramite useFirebase() hook type-safe
           *
           * POTENTIAL FUTURE UPGRADE:
           * - AppProvider.js → AppProvider.tsx
           * - Type-safe context value
           * - Integration con Firebase types
           */}
          <AppProvider>
            {/* =====================================================
                APP LAYOUT - Livello 5 (INVARIATO)
                ===================================================== */}
            {/**
             * AppLayout - ESISTENTE, nessuna modifica
             *
             * POTENTIAL FUTURE UPGRADE:
             * - AppLayout.js → AppLayout.tsx
             * - Type-safe props
             * - Integration con Firebase user state
             */}
            <AppLayout>
              {/* =====================================================
                  APP ROUTER - Livello 6 (INVARIATO)
                  ===================================================== */}
              {/**
               * AppRouter - ESISTENTE, nessuna modifica
               *
               * POTENTIAL FUTURE UPGRADE:
               * - AppRouter.js → AppRouter.tsx
               * - Type-safe routing
               * - Firebase-aware routing
               */}
              <AppRouter />
            </AppLayout>
          </AppProvider>
        </FirebaseProvider>
      </NotificationProvider>
    </MainAppErrorBoundary>
  );
};

// =====================================================
// EXPORT DEFAULT TypeScript
// =====================================================

export default VocabularyApp;

// =====================================================
// 📋 TypeScript UPGRADE NOTES
// =====================================================

/**
 * 🔥 COSA È CAMBIATO (TypeScript):
 *
 * ✅ AGGIUNTO: FirebaseProvider type-safe nel provider chain
 * ✅ POSIZIONE: Dopo NotificationProvider, prima di AppProvider
 * ✅ TYPE SAFETY: Error handling completamente tipizzato
 * ✅ BENEFICI:
 *    - Firebase disponibile a tutti i componenti figli (type-safe)
 *    - AppProvider può usare Firebase nei suoi hook (typed)
 *    - Error handling Firebase integrato con sistema esistente (typed)
 *    - Loading states gestiti automaticamente (typed)
 *    - IntelliSense completo per Firebase context
 *
 * ❌ COSA NON È CAMBIATO:
 * - Tutta l'architettura esistente rimane identica
 * - Nessun componente figlio deve essere modificato subito
 * - ErrorBoundary, NotificationProvider, AppProvider funzionano come prima
 * - AppLayout e AppRouter invariati
 *
 * 🎯 PROSSIMI STEP:
 * 1. Installare Firebase: npm install firebase
 * 2. Aggiungere src/config/firebase.ts
 * 3. Aggiungere src/contexts/FirebaseContext.tsx
 * 4. Rinominare App.js → App.tsx
 * 5. Testare inizializzazione Firebase type-safe
 * 6. Procedere con useFirestore.ts hook
 */

/**
 * 🔧 ARCHITETTURA TypeScript AGGIORNATA:
 *
 * MainAppErrorBoundary (Livello 1) [Type-safe error handling]
 *   └── NotificationProvider (Livello 2) [Existing]
 *       └── FirebaseProvider (Livello 3) ← NUOVO TypeScript
 *           └── AppProvider (Livello 4) [Existing - can use Firebase]
 *               └── AppLayout (Livello 5) [Existing]
 *                   └── AppRouter (Livello 6) [Existing]
 *                       └── Views (MainView, TestView, etc.) [Existing]
 *
 * 🔄 FLUSSO DATI TypeScript:
 * - Firebase inizializza per primo (type-safe)
 * - AppProvider può usare Firebase nei suoi hook (typed context)
 * - Views possono usare sia AppContext che FirebaseContext (typed)
 * - Error handling centralizzato cattura errori Firebase (typed errors)
 * - Notifications disponibili per feedback Firebase (typed notifications)
 */

/**
 * 🪝 HOOK TypeScript DISPONIBILI AI COMPONENTI:
 *
 * // Firebase Context (NEW - Type-safe)
 * const {
 *   isReady,
 *   initialized,
 *   error,
 *   retryInitialization
 * }: FirebaseContextValue = useFirebase();
 *
 * // Utility hooks (NEW - Type-safe)
 * const isReady: boolean = useFirebaseReady();
 * const error: Error | null = useFirebaseError();
 *
 * // App Context (esistente, invariato)
 * const { words, addWord, startTest, ... } = useAppContext();
 *
 * // Notification Context (esistente, invariato)
 * const { showSuccess, showError, ... } = useNotificationContext();
 */

/**
 * 🔮 FUTURE TypeScript MIGRATION PATH:
 *
 * 1. **IMMEDIATE** (questo step):
 *    - Firebase integration type-safe ✅
 *    - App.js → App.tsx ✅
 *    - Core infrastructure type-safe ✅
 *
 * 2. **NEXT STEPS** (graduale):
 *    - AppContext.js → AppContext.tsx
 *    - useWords.js → useWords.ts
 *    - useTest.js → useTest.ts
 *    - useStats.js → useStats.ts
 *
 * 3. **COMPONENTS** (quando pronti):
 *    - AppLayout.js → AppLayout.tsx
 *    - AppRouter.js → AppRouter.tsx
 *    - MainView.js → MainView.tsx
 *    - Etc.
 *
 * 4. **BENEFITS**:
 *    - IntelliSense completo
 *    - Compile-time error detection
 *    - Refactoring sicuro
 *    - Documentation automatica via types
 *    - Better developer experience
 */
