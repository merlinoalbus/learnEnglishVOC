// =====================================================
// 📁 types/entities/User.types.ts - Entità User e Autenticazione
// =====================================================

/**
 * Definizione completa dell'entità User con profilo, preferenze e autenticazione
 * Preparato per: Firebase Auth integration e gestione profilo utente
 * Basato su: pattern autenticazione da AppContext.js e preparazione per Firestore
 */

// =====================================================
// 👤 USER CORE ENTITY
// =====================================================

/**
 * Entità User base per autenticazione
 * Preparata per: Firebase Auth integration
 * Basata su: standard Firebase User properties
 */
export interface User {
  /** ID univoco utente - Firebase UID */
  id: string;

  /** Email utente - da Firebase Auth */
  email: string;

  /** Nome display - opzionale da Firebase Auth */
  displayName?: string;

  /** URL foto profilo - opzionale da Firebase Auth */
  photoURL?: string;

  /** Flag email verificata - da Firebase Auth */
  emailVerified: boolean;

  /** Provider autenticazione (google, email, etc.) */
  providerId: string;

  /** Timestamp creazione account */
  createdAt: Date;

  /** Timestamp ultimo accesso */
  lastLoginAt: Date;

  /** Metadata Firestore - usa FirestoreDocMetadata generic */
  firestoreMetadata?: import("../infrastructure/Firestore.types").FirestoreDocMetadata;
}

/**
 * Profilo utente esteso
 * Per: dati aggiuntivi non gestiti da Firebase Auth
 * Basato su: necessità app vocabulary learning
 */
export interface UserProfile {
  /** ID utente proprietario */
  userId: string;

  /** Nome completo */
  fullName?: string;

  /** Lingua nativa */
  nativeLanguage: string;

  /** Lingua target (inglese per la nostra app) */
  targetLanguage: string;

  /** Livello inglese corrente */
  englishLevel: EnglishLevel;

  /** Obiettivo apprendimento */
  learningGoal?: LearningGoal;

  /** Parole target giornaliere */
  dailyWordTarget: number;

  /** Test preferiti settimanali */
  weeklyTestTarget: number;

  /** Bio/descrizione utente */
  bio?: string;

  /** Timestamp creazione profilo */
  createdAt: Date;

  /** Timestamp ultimo aggiornamento */
  updatedAt: Date;
}

/**
 * Livelli inglese supportati
 * Basato su: standard CEFR levels
 */
export type EnglishLevel =
  | "A1" // Beginner
  | "A2" // Elementary
  | "B1" // Intermediate
  | "B2" // Upper Intermediate
  | "C1" // Advanced
  | "C2"; // Proficiency

/**
 * Obiettivi di apprendimento
 * Per: personalizzazione esperienza utente
 */
export type LearningGoal =
  | "academic" // Studio accademico
  | "business" // Inglese business
  | "travel" // Viaggi
  | "general" // Uso generale
  | "exam" // Preparazione esami
  | "conversation"; // Conversazione

// =====================================================
// ⚙️ USER PREFERENCES
// =====================================================

/**
 * Preferenze utente per personalizzazione app
 * Basate su: necessità configurazione UI e UX
 * Preparate per: useTheme e useUIManager hooks
 */
export interface UserPreferences {
  /** ID utente proprietario */
  userId: string;

  /** Tema app */
  theme: AppTheme;

  /** Lingua interfaccia */
  interfaceLanguage: InterfaceLanguage;

  /** Preferenze test */
  testPreferences: TestPreferences;

  /** Preferenze notifiche */
  notificationPreferences: NotificationPreferences;

  /** Preferenze audio */
  audioPreferences: AudioPreferences;

  /** Preferenze display */
  displayPreferences: DisplayPreferences;

  /** Timestamp ultimo aggiornamento */
  updatedAt: Date;
}

/**
 * Tema applicazione
 * Per: useTheme hook implementation
 */
export type AppTheme = "light" | "dark" | "auto";

/**
 * Lingua interfaccia
 * Per: internazionalizzazione futura
 */
export type InterfaceLanguage = "it" | "en" | "auto";

/**
 * Preferenze test utente
 * Basate su: configurazioni utilizzate in TestView.js e ChapterTestSelector.js
 */
export interface TestPreferences {
  /** Modalità test predefinita */
  defaultTestMode: "normal" | "difficult-only";

  /** Numero parole per test */
  defaultWordsPerTest: number;

  /** Abilitazione hint */
  hintsEnabled: boolean;

  /** Delay automatico tra parole (ms) */
  autoAdvanceDelay: number;

  /** Mostra significato dopo risposta */
  showMeaningAfterAnswer: boolean;

  /** Timer visibile durante test */
  showTimer: boolean;

  /** Suoni abilitati */
  soundsEnabled: boolean;
}

/**
 * Preferenze notifiche
 * Per: sistema notifiche e reminder
 */
export interface NotificationPreferences {
  /** Notifiche push abilitate */
  pushEnabled: boolean;

  /** Notifiche email abilitate */
  emailEnabled: boolean;

  /** Reminder giornaliero studio */
  dailyReminder: boolean;

  /** Orario reminder (HH:MM) */
  reminderTime: string;

  /** Reminder test settimanale */
  weeklyTestReminder: boolean;

  /** Notifiche progresso */
  progressNotifications: boolean;

  /** Notifiche achievement */
  achievementNotifications: boolean;
}

/**
 * Preferenze audio
 * Per: funzionalità audio future (TTS, pronuncia)
 */
export interface AudioPreferences {
  /** Pronuncia automatica parole */
  autoPlayPronunciation: boolean;

  /** Volume audio (0-1) */
  volume: number;

  /** Voce TTS preferita */
  preferredVoice?: string;

  /** Velocità riproduzione */
  playbackSpeed: number;

  /** Audio feedback azioni */
  actionSounds: boolean;
}

/**
 * Preferenze display
 * Per: customizzazione UI
 */
export interface DisplayPreferences {
  /** Dimensione font */
  fontSize: FontSize;

  /** Contrasto alto */
  highContrast: boolean;

  /** Animazioni ridotte */
  reducedMotion: boolean;

  /** Densità informazioni */
  compactView: boolean;

  /** Mostra statistiche avanzate */
  showAdvancedStats: boolean;
}

/**
 * Dimensioni font disponibili
 * Per: accessibilità e customizzazione
 */
export type FontSize = "small" | "medium" | "large" | "extra-large";

// =====================================================
// 📊 USER STATISTICS & PROGRESS
// =====================================================

/**
 * Statistiche utente aggregate
 * Per: dashboard e tracking progresso
 * Basate su: necessità stats da StatsView.js e useStats.js
 */
export interface UserStats {
  /** ID utente proprietario */
  userId: string;

  /** Giorni totali attivi */
  totalActiveDays: number;

  /** Streak giorni consecutivi */
  currentStreak: number;

  /** Streak record */
  longestStreak: number;

  /** Totale parole aggiunte */
  totalWordsAdded: number;

  /** Totale parole apprese */
  totalWordsLearned: number;

  /** Totale test completati */
  totalTestsCompleted: number;

  /** Tempo totale studio (minuti) */
  totalStudyTime: number;

  /** Accuratezza media test */
  averageTestAccuracy: number;

  /** Livello progresso calcolato */
  progressLevel: number;

  /** Prossimo milestone */
  nextMilestone: UserMilestone;

  /** Timestamp ultimo aggiornamento */
  updatedAt: Date;
}

/**
 * Milestone/achievement utente
 * Per: gamification e motivazione
 */
export interface UserMilestone {
  /** ID milestone */
  id: string;

  /** Nome milestone */
  name: string;

  /** Descrizione */
  description: string;

  /** Icona/badge */
  icon: string;

  /** Target da raggiungere */
  target: number;

  /** Progresso attuale */
  progress: number;

  /** Completato */
  completed: boolean;

  /** Data completamento */
  completedAt?: Date;

  /** Ricompensa */
  reward?: string;
}

// =====================================================
// 🔐 AUTHENTICATION TYPES
// =====================================================

/**
 * Stato autenticazione corrente
 * Per: useAuth hook e AuthContext
 * Basato su: necessità gestione auth in AppContext.js
 */
export interface AuthState {
  /** Utente correntemente autenticato */
  currentUser: User | null;

  /** Stato loading autenticazione */
  isLoading: boolean;

  /** Stato inizializzazione auth */
  isInitialized: boolean;

  /** Errore autenticazione */
  error: AuthError | null;

  /** Token di accesso Firebase */
  accessToken?: string;

  /** Timestamp ultimo refresh token */
  tokenRefreshedAt?: Date;
}

/**
 * Errori autenticazione tipizzati
 * Per: gestione specifica errori Firebase Auth
 */
export interface AuthError {
  /** Codice errore Firebase */
  code: string;

  /** Messaggio errore */
  message: string;

  /** Tipo errore */
  type: AuthErrorType;

  /** Dettagli aggiuntivi */
  details?: Record<string, any>;

  /** Timestamp errore */
  timestamp: Date;
}

/**
 * Tipi errore autenticazione
 * Per: gestione specifica per tipo
 */
export type AuthErrorType =
  | "network-error"
  | "invalid-credentials"
  | "user-not-found"
  | "email-already-in-use"
  | "weak-password"
  | "email-not-verified"
  | "account-disabled"
  | "token-expired"
  | "permission-denied"
  | "configuration-error"
  | "unknown";

// =====================================================
// 🔄 AUTH OPERATIONS
// =====================================================

/**
 * Input per registrazione utente
 * Per: signup operation
 */
export interface SignUpInput {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
  preferredLanguage?: InterfaceLanguage;
}

/**
 * Input per login utente
 * Per: signin operation
 */
export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Input per reset password
 * Per: password reset operation
 */
export interface ResetPasswordInput {
  email: string;
}

/**
 * Input per aggiornamento profilo
 * Per: profile update operation
 */
export interface UpdateProfileInput {
  displayName?: string;
  photoURL?: string;
  currentPassword?: string;
  newPassword?: string;
}

/**
 * Risultato operazione autenticazione
 * Per: feedback operazioni auth
 */
export interface AuthOperationResult {
  /** Operazione riuscita */
  success: boolean;

  /** Utente risultante (se success) */
  user?: User;

  /** Errore (se failure) */
  error?: AuthError;

  /** Azione richiesta (es. verifica email) */
  requiredAction?: "verify-email" | "complete-profile" | "change-password";

  /** Messaggio per utente */
  message?: string;
}

// =====================================================
// 📱 USER SESSION
// =====================================================

/**
 * Sessione utente corrente
 * Per: tracking sessione e analytics
 */
export interface UserSession {
  /** ID sessione */
  sessionId: string;

  /** ID utente */
  userId: string;

  /** Timestamp inizio sessione */
  startedAt: Date;

  /** Timestamp ultimo activity */
  lastActivityAt: Date;

  /** Device/browser info */
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
  };

  /** Attività sessione */
  activities: SessionActivity[];

  /** Durata sessione (calcolata) */
  duration?: number;

  /** Sessione attiva */
  isActive: boolean;
}

/**
 * Attività in sessione
 * Per: analytics dettagliato usage
 */
export interface SessionActivity {
  /** Tipo attività */
  type:
    | "page-view"
    | "word-added"
    | "test-started"
    | "test-completed"
    | "export"
    | "import";

  /** Timestamp attività */
  timestamp: Date;

  /** Dettagli attività */
  details?: Record<string, any>;

  /** Durata attività (se applicabile) */
  duration?: number;
}
