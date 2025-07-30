// =====================================================
// 📁 types/infrastructure/Auth.types.ts - FIXED & COMPLETED
// =====================================================

/**
 * CORREZIONI PRINCIPALI:
 * ✅ COMPLETA il file (era troncato a metà)
 * ✅ ELIMINA duplicazione AuthState con User.types.ts (quella rimane in User.types.ts)
 * ✅ ALLINEA con necessità Firebase Auth integration
 * ✅ RIMUOVE over-engineering non necessario per l'app AS-IS
 * ✅ MANTIENE focus su infrastructure types, non entity types
 */

// =====================================================
// 🔐 AUTH USER INFRASTRUCTURE - CORE
// =====================================================

/**
 * Utente autenticato base
 * FONTE: Firebase Auth User interface standard
 * CORREZIONE: Focus su infrastructure, non entity (quella è in User.types.ts)
 */
export interface AuthUser {
  /** UID Firebase univoco */
  uid: string;

  /** Email utente */
  email: string | null;

  /** Nome display */
  displayName: string | null;

  /** URL foto profilo */
  photoURL: string | null;

  /** Numero telefono */
  phoneNumber: string | null;

  /** Email verificata */
  emailVerified: boolean;

  /** Anonimo */
  isAnonymous: boolean;

  /** Metadata utente */
  metadata: AuthUserMetadata;

  /** Provider informazioni */
  providerData: AuthProviderData[];

  /** Claims custom */
  customClaims?: Record<string, any>;

  /** Token ID attuale */
  accessToken?: string;

  /** Refresh token */
  refreshToken?: string;
}

/**
 * Metadata utente autenticazione
 * FONTE: Firebase Auth standard metadata
 */
export interface AuthUserMetadata {
  /** Data creazione account */
  creationTime: Date;

  /** Ultimo sign-in */
  lastSignInTime: Date;

  /** Ultimo refresh token */
  lastRefreshTime?: Date;
}

/**
 * Dati provider autenticazione
 * FONTE: Firebase Auth provider data structure
 */
export interface AuthProviderData {
  /** ID provider */
  providerId: string;

  /** UID nel provider */
  uid: string;

  /** Email nel provider */
  email: string | null;

  /** Nome display nel provider */
  displayName: string | null;

  /** Photo URL nel provider */
  photoURL: string | null;

  /** Numero telefono nel provider */
  phoneNumber: string | null;
}

// =====================================================
// 🔄 AUTH STATE INFRASTRUCTURE
// =====================================================

/**
 * Stato connessione autenticazione
 * CORREZIONE: Solo infrastructure connection state, non entity state
 */
export interface AuthConnectionState {
  /** Connesso a Firebase Auth */
  connected: boolean;

  /** Ultima connessione riuscita */
  lastConnectedAt?: Date;

  /** Errore connessione */
  connectionError?: AuthError;

  /** Tentativi reconnect */
  reconnectAttempts: number;

  /** Prossimo tentativo reconnect */
  nextReconnectAt?: Date;
}

/**
 * Sessione autenticazione corrente
 * FONTE: Session tracking requirements
 */
export interface AuthSession {
  /** ID sessione */
  sessionId: string;

  /** Inizio sessione */
  startedAt: Date;

  /** Ultima attività */
  lastActivityAt: Date;

  /** Durata sessione (ms) */
  duration: number;

  /** IP address */
  ipAddress?: string;

  /** User agent */
  userAgent?: string;

  /** Device info */
  deviceInfo?: AuthDeviceInfo;

  /** Sessione attiva */
  isActive: boolean;

  /** Scadenza sessione */
  expiresAt?: Date;
}

/**
 * Informazioni device per sessione
 */
export interface AuthDeviceInfo {
  /** Tipo device */
  type: "desktop" | "mobile" | "tablet" | "unknown";

  /** OS */
  os: string;

  /** Browser */
  browser: string;

  /** Versione browser */
  browserVersion: string;

  /** Schermo risoluzione */
  screenResolution?: string;

  /** Timezone */
  timezone: string;

  /** Lingua */
  language: string;
}

// =====================================================
// ⚙️ AUTH CONFIGURATION
// =====================================================

/**
 * Configurazione autenticazione
 * CORREZIONE: Simplified per necessità app reale
 */
export interface AuthConfig {
  /** Provider abilitati */
  enabledProviders: AuthProvider[];

  /** Persistenza auth */
  persistence: AuthPersistence;

  /** Configurazione token */
  tokenConfig: AuthTokenConfig;

  /** Configurazione sicurezza */
  securityConfig: AuthSecurityConfig;

  /** Configurazione UI - simplified */
  uiConfig?: AuthUIConfig;

  /** URL redirect - simplified */
  redirectUrls?: AuthRedirectUrls;

  /** Configurazione email */
  emailConfig?: AuthEmailConfig;
}

/**
 * Provider autenticazione supportati
 * CORREZIONE: Ridotto a quelli realmente utili per l'app
 */
export type AuthProvider = "email" | "google" | "anonymous";

/**
 * Persistenza auth
 */
export type AuthPersistence =
  | "local" // Persiste fino a logout esplicito
  | "session" // Persiste solo per session
  | "none"; // Nessuna persistenza

/**
 * Configurazione token auth
 */
export interface AuthTokenConfig {
  /** Auto-refresh token */
  autoRefresh: boolean;

  /** Intervallo refresh (ms) */
  refreshInterval: number;

  /** Tempo expire token (ms) */
  tokenExpiry: number;

  /** Buffer refresh (ms) */
  refreshBuffer: number;

  /** Include custom claims */
  includeCustomClaims: boolean;
}

/**
 * Configurazione sicurezza auth
 * CORREZIONE: Simplified per app vocabulary learning
 */
export interface AuthSecurityConfig {
  /** Richiedi email verification */
  requireEmailVerification: boolean;

  /** Policy password */
  passwordPolicy: PasswordPolicy;

  /** Timeout sessione (ms) */
  sessionTimeout: number;

  /** Max tentativi login */
  maxLoginAttempts: number;

  /** Lockout dopo fallimenti */
  lockoutDuration: number;
}

/**
 * Policy password
 * CORREZIONE: Reasonable requirements
 */
export interface PasswordPolicy {
  /** Lunghezza minima */
  minLength: number;

  /** Richiedi uppercase */
  requireUppercase: boolean;

  /** Richiedi lowercase */
  requireLowercase: boolean;

  /** Richiedi numeri */
  requireNumbers: boolean;

  /** Richiedi simboli */
  requireSymbols: boolean;
}

/**
 * Configurazione UI auth
 * CORREZIONE: Basic UI config
 */
export interface AuthUIConfig {
  /** Tema UI */
  theme: "light" | "dark" | "auto";

  /** Logo app */
  appLogo?: string;

  /** Colori primari */
  primaryColors?: string[];

  /** Lingua default */
  defaultLanguage: string;

  /** Terms URL */
  termsUrl?: string;

  /** Privacy policy URL */
  privacyPolicyUrl?: string;
}

/**
 * URL redirect auth
 * CORREZIONE: Basic redirects needed
 */
export interface AuthRedirectUrls {
  /** Dopo login riuscito */
  signInSuccess: string;

  /** Dopo logout */
  signOut: string;

  /** Dopo registrazione */
  signUp: string;

  /** Dopo reset password */
  passwordReset: string;

  /** In caso di errore */
  error: string;
}

/**
 * Configurazione email auth
 * CORREZIONE: Completed file (was truncated)
 */
export interface AuthEmailConfig {
  /** Template email verification */
  verificationTemplate: EmailTemplate;

  /** Template password reset */
  passwordResetTemplate: EmailTemplate;

  /** Template welcome email */
  welcomeTemplate?: EmailTemplate;

  /** Sender email */
  senderEmail: string;

  /** Sender name */
  senderName: string;
}

/**
 * Template email
 * CORREZIONE: Basic email template structure
 */
export interface EmailTemplate {
  /** Subject email */
  subject: string;

  /** Body HTML */
  bodyHtml: string;

  /** Body text */
  bodyText: string;

  /** Variabili supportate */
  supportedVariables: string[];
}

// =====================================================
// ❌ AUTH ERROR HANDLING
// =====================================================

/**
 * Errore autenticazione tipizzato
 * FONTE: Firebase Auth error codes standard
 * CORREZIONE: Focused su errori realmente gestiti
 */
export interface AuthError {
  /** Codice errore Firebase */
  code: string;

  /** Messaggio errore */
  message: string;

  /** Dettagli errore */
  details?: any;

  /** Operazione che ha causato errore */
  operation: AuthOperation;

  /** Recuperabile con retry */
  recoverable: boolean;

  /** Timestamp errore */
  timestamp: Date;

  /** Tipo errore categorizzato */
  type: AuthErrorType;
}

/**
 * Codici errore auth comuni
 * CORREZIONE: Solo quelli che l'app deve gestire
 */
export type AuthErrorCode =
  | "permission-denied"
  | "user-not-found"
  | "wrong-password"
  | "email-already-in-use"
  | "weak-password"
  | "invalid-email"
  | "user-disabled"
  | "too-many-requests"
  | "network-request-failed"
  | "internal-error"
  | "invalid-credential"
  | "requires-recent-login";

/**
 * Tipi errore categorizzati
 * CORREZIONE: Categorizzazione per gestione specifica
 */
export type AuthErrorType =
  | "network-error"
  | "invalid-credentials"
  | "user-management"
  | "permission-denied"
  | "rate-limited"
  | "configuration-error"
  | "unknown";

/**
 * Operazioni auth
 */
export type AuthOperation =
  | "sign-in"
  | "sign-up"
  | "sign-out"
  | "password-reset"
  | "email-verification"
  | "profile-update"
  | "delete-account"
  | "refresh-token"
  | "link-provider"
  | "unlink-provider";

// =====================================================
// 🔄 AUTH OPERATIONS INPUT/OUTPUT
// =====================================================

/**
 * Input per sign in con email
 */
export interface SignInWithEmailInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Input per sign up con email
 */
export interface SignUpWithEmailInput {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
}

/**
 * Input per sign in con provider
 */
export interface SignInWithProviderInput {
  provider: AuthProvider;
  scopes?: string[];
  customParameters?: Record<string, any>;
}

/**
 * Input per reset password
 */
export interface ResetPasswordInput {
  email: string;
}

/**
 * Input per update profilo
 */
export interface UpdateProfileInput {
  displayName?: string;
  photoURL?: string;
}

/**
 * Input per update email
 */
export interface UpdateEmailInput {
  newEmail: string;
  currentPassword: string;
}

/**
 * Input per update password
 */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * Input per re-autenticazione
 */
export interface ReauthenticateInput {
  password?: string;
  provider?: AuthProvider;
}

/**
 * Risultato operazione auth
 * CORREZIONE: Simplified result structure
 */
export interface AuthOperationResult {
  /** Operazione riuscita */
  success: boolean;

  /** Utente risultante (se success) */
  user?: AuthUser;

  /** Errore (se failure) */
  error?: AuthError;

  /** Azione richiesta */
  requiredAction?: AuthRequiredAction;

  /** Messaggio per utente */
  message?: string;

  /** Metadata operazione */
  metadata: AuthOperationMetadata;
}

/**
 * Metadata operazione auth
 */
export interface AuthOperationMetadata {
  /** Timestamp operazione */
  timestamp: Date;

  /** Durata operazione (ms) */
  duration: number;

  /** Device info */
  deviceInfo?: AuthDeviceInfo;

  /** IP address */
  ipAddress?: string;
}

/**
 * Azione richiesta dopo operazione
 */
export type AuthRequiredAction =
  | "verify-email"
  | "complete-profile"
  | "change-password"
  | "setup-2fa"
  | "accept-terms"
  | "reauthenticate";

// =====================================================
// 🔐 ADVANCED AUTH FEATURES (OPTIONAL)
// =====================================================

/**
 * Configurazione 2FA
 * CORREZIONE: Optional advanced feature
 */
export interface TwoFactorAuthConfig {
  /** 2FA abilitato */
  enabled: boolean;

  /** Metodi supportati */
  supportedMethods: TwoFactorMethod[];

  /** Backup codes */
  enableBackupCodes: boolean;

  /** Grace period (ms) */
  gracePeriod: number;
}

/**
 * Metodi 2FA
 */
export type TwoFactorMethod =
  | "sms"
  | "email"
  | "authenticator"
  | "backup-codes";

/**
 * Token auth
 */
export interface AuthToken {
  /** Token value */
  token: string;

  /** Timestamp expire */
  expiresAt: Date;

  /** Claims inclusi */
  claims: TokenClaims;

  /** Refresh token */
  refreshToken?: string;
}

/**
 * Claims token
 */
export interface TokenClaims {
  /** User ID */
  sub: string;

  /** Email */
  email?: string;

  /** Email verificata */
  email_verified?: boolean;

  /** Provider */
  firebase?: {
    identities?: Record<string, string[]>;
    sign_in_provider?: string;
  };

  /** Custom claims */
  [key: string]: any;
}

// =====================================================
// 📊 AUTH ANALYTICS (OPTIONAL)
// =====================================================

/**
 * Analytics autenticazione
 * CORREZIONE: Optional analytics for advanced usage
 */
export interface AuthAnalytics {
  /** Statistiche login */
  loginStats: LoginStatistics;

  /** Pattern comportamentali */
  behaviorPatterns: AuthBehaviorPatterns;

  /** Eventi sicurezza */
  securityEvents: SecurityEvent[];

  /** Utilizzo device */
  deviceUsage: DeviceUsage[];
}

/**
 * Statistiche login
 */
export interface LoginStatistics {
  /** Totale login */
  totalLogins: number;

  /** Login ultimi 30 giorni */
  loginsLast30Days: number;

  /** Provider più utilizzato */
  mostUsedProvider: AuthProvider;

  /** Media sessioni al giorno */
  averageSessionsPerDay: number;

  /** Durata media sessione */
  averageSessionDuration: number;
}

/**
 * Pattern comportamentali auth
 */
export interface AuthBehaviorPatterns {
  /** Orari login preferiti */
  preferredLoginTimes: number[];

  /** Device preferiti */
  preferredDevices: string[];

  /** Frequenza login */
  loginFrequency: "daily" | "weekly" | "monthly" | "irregular";

  /** Consistenza utilizzo */
  usageConsistency: number;
}

/**
 * Eventi sicurezza
 */
export interface SecurityEvent {
  /** ID evento */
  id: string;

  /** Tipo evento */
  type: SecurityEventType;

  /** Timestamp evento */
  timestamp: Date;

  /** Descrizione */
  description: string;

  /** Severity */
  severity: "low" | "medium" | "high" | "critical";

  /** Metadata evento */
  metadata: Record<string, any>;
}

/**
 * Tipi eventi sicurezza
 */
export type SecurityEventType =
  | "login-success"
  | "login-failure"
  | "password-reset"
  | "email-change"
  | "suspicious-activity"
  | "device-change"
  | "location-change"
  | "account-locked"
  | "account-disabled";

/**
 * Utilizzo device
 */
export interface DeviceUsage {
  /** Device ID */
  deviceId: string;

  /** Device info */
  deviceInfo: AuthDeviceInfo;

  /** Primo utilizzo */
  firstUsed: Date;

  /** Ultimo utilizzo */
  lastUsed: Date;

  /** Numero login */
  loginCount: number;

  /** Trusted device */
  trusted: boolean;
}
