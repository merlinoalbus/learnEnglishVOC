// =====================================================
// 📁 types/infrastructure/Firestore.types.ts - Tipi Generici Integrazione Firestore
// =====================================================

/**
 * Tipi generici per integrazione Firestore
 * Preparati per: sostituzione localStorage con Firestore nel gruppo Core Infrastructure
 * Include: generic document interfaces, query types, real-time listeners e error handling
 */

// =====================================================
// 🔥 FIRESTORE DOCUMENT GENERICS
// =====================================================

/**
 * Generic Firestore Document interface
 * Per: wrapping qualsiasi entity con metadata Firestore
 * Utilizzato da: tutti i document Firestore nell'app
 */
export interface FirestoreDoc<T = any> {
  /** ID documento Firestore */
  id: string;

  /** Dati entity originali */
  data: T;

  /** Metadata Firestore standard */
  metadata: FirestoreDocMetadata;

  /** Path documento Firestore */
  path: string;

  /** Reference documento Firestore */
  ref?: any; // FirebaseFirestore.DocumentReference (evita dipendenza Firebase)
}

/**
 * Metadata standard Firestore per tutti i document
 * Basato su: pattern metadata utilizzato nell'app esistente
 * Include: tracking user, versioning, timestamps
 */
export interface FirestoreDocMetadata {
  /** ID utente proprietario - per auth-scoped data access */
  userId: string;

  /** Timestamp creazione documento */
  createdAt: Date;

  /** Timestamp ultimo aggiornamento */
  updatedAt: Date;

  /** Versione documento per conflict resolution */
  version: number;

  /** Device che ha creato il documento */
  createdOnDevice?: string;

  /** Device ultimo aggiornamento */
  lastUpdatedOnDevice?: string;

  /** Flag soft delete */
  deleted?: boolean;

  /** Timestamp soft delete */
  deletedAt?: Date;

  /** Ultimo sync riuscito */
  lastSyncAt?: Date;

  /** Metadata aggiuntivi custom */
  custom?: Record<string, any>;
}

// =====================================================
// 📋 FIRESTORE COLLECTIONS
// =====================================================

/**
 * Generic Collection interface
 * Per: gestione tipizzata delle collezioni Firestore
 * Utilizzato da: operazioni CRUD collections
 */
export interface FirestoreCollection<T = any> {
  /** Nome collezione */
  name: string;

  /** Path collezione completo */
  path: string;

  /** Documenti nella collezione */
  docs: FirestoreDoc<T>[];

  /** Metadata collezione */
  metadata: FirestoreCollectionMetadata;

  /** Reference collezione Firestore */
  ref?: any; // FirebaseFirestore.CollectionReference
}

/**
 * Metadata collezione Firestore
 * Per: informazioni aggregate sulla collezione
 */
export interface FirestoreCollectionMetadata {
  /** Numero totale documenti */
  totalDocs: number;

  /** Dimensione collezione stimata */
  estimatedSize: number;

  /** Ultimo documento aggiunto */
  lastDocAdded?: Date;

  /** Ultimo documento modificato */
  lastDocModified?: Date;

  /** Schema version collezione */
  schemaVersion: string;

  /** Indici attivi */
  activeIndexes?: string[];
}

// =====================================================
// 🔍 FIRESTORE QUERIES
// =====================================================

/**
 * Generic Query interface tipizzata
 * Per: query sicure e tipizzate su Firestore
 * Utilizzato da: tutte le operazioni query nell'app
 */
export interface FirestoreQuery<T = any> {
  /** Collezione target */
  collection: string;

  /** Filtri query */
  where?: WhereClause[];

  /** Ordinamento risultati */
  orderBy?: OrderByClause[];

  /** Limite risultati */
  limit?: number;

  /** Offset risultati */
  offset?: number;

  /** Cursor per paginazione */
  startAfter?: any;

  /** Cursor per paginazione reverse */
  endBefore?: any;

  /** Include documenti eliminati */
  includeDeleted?: boolean;

  /** Scope user (auth-based filtering) */
  userScoped?: boolean;
}

/**
 * Clausola WHERE per query Firestore
 * Per: filtri tipizzati e sicuri
 */
export interface WhereClause {
  /** Campo da filtrare */
  field: string;

  /** Operatore filtro */
  operator: FirestoreOperator;

  /** Valore filtro */
  value: any;

  /** Operatore logico con clausola successiva */
  logicalOperator?: "AND" | "OR";
}

/**
 * Operatori supportati Firestore
 * Per: type safety nelle query
 */
export type FirestoreOperator =
  | "=="
  | "!="
  | "<"
  | "<="
  | ">"
  | ">="
  | "array-contains"
  | "array-contains-any"
  | "in"
  | "not-in";

/**
 * Clausola ORDER BY per query
 * Per: ordinamento risultati query
 */
export interface OrderByClause {
  /** Campo per ordinamento */
  field: string;

  /** Direzione ordinamento */
  direction: "asc" | "desc";
}

/**
 * Risultato query Firestore
 * Per: response tipizzata delle query
 */
export interface FirestoreQueryResult<T = any> {
  /** Documenti risultato */
  docs: FirestoreDoc<T>[];

  /** Numero totale risultati */
  totalCount: number;

  /** Query eseguita */
  query: FirestoreQuery<T>;

  /** Metadata query execution */
  queryMetadata: QueryExecutionMetadata;

  /** Presenza di più risultati (per paginazione) */
  hasMore: boolean;

  /** Cursor per prossima pagina */
  nextPageCursor?: any;

  /** Cursor per pagina precedente */
  prevPageCursor?: any;
}

/**
 * Metadata esecuzione query
 * Per: performance monitoring e debugging
 */
export interface QueryExecutionMetadata {
  /** Tempo esecuzione query (ms) */
  executionTime: number;

  /** Query da cache */
  fromCache: boolean;

  /** Documenti letti da Firestore */
  docsRead: number;

  /** Timestamp esecuzione */
  executedAt: Date;

  /** Query hash per caching */
  queryHash?: string;

  /** Indici utilizzati */
  indexesUsed?: string[];
}

// =====================================================
// 🔄 REAL-TIME LISTENERS
// =====================================================

/**
 * Real-time Listener tipizzato
 * Per: subscription real-time ai documenti Firestore
 * Utilizzato da: sync real-time nell'app
 */
export interface FirestoreListener<T = any> {
  /** ID univoco listener */
  id: string;

  /** Tipo listener */
  type: ListenerType;

  /** Target listener */
  target: ListenerTarget;

  /** Callback per cambiamenti */
  onDataChange: (data: FirestoreListenerData<T>) => void;

  /** Callback per errori */
  onError: (error: FirestoreError) => void;

  /** Stato listener */
  state: ListenerState;

  /** Configurazione listener */
  config: ListenerConfig;

  /** Metadata listener */
  metadata: ListenerMetadata;
}

/**
 * Tipi listener supportati
 * Per: diversi tipi subscription real-time
 */
export type ListenerType =
  | "document" // Singolo documento
  | "collection" // Intera collezione
  | "query" // Query specifica
  | "subcollection"; // Sotto-collezione

/**
 * Target del listener
 * Per: specificare cosa ascoltare
 */
export interface ListenerTarget {
  /** Tipo target */
  type: ListenerType;

  /** Path Firestore */
  path: string;

  /** Query (se type = 'query') */
  query?: FirestoreQuery;

  /** ID documento parent (se subcollection) */
  parentDocId?: string;
}

/**
 * Stato listener
 * Per: tracking stato connection real-time
 */
export type ListenerState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
  | "disposed";

/**
 * Configurazione listener
 * Per: opzioni comportamento listener
 */
export interface ListenerConfig {
  /** Include metadata nei cambiamenti */
  includeMetadataChanges: boolean;

  /** Source dati preferita */
  source: "default" | "server" | "cache";

  /** Auto-retry su disconnessione */
  autoRetry: boolean;

  /** Timeout retry (ms) */
  retryTimeout: number;

  /** Max tentativi retry */
  maxRetries: number;

  /** Debounce cambiamenti (ms) */
  debounceMs?: number;
}

/**
 * Metadata listener
 * Per: tracking performance e debug listener
 */
export interface ListenerMetadata {
  /** Timestamp creazione listener */
  createdAt: Date;

  /** Ultimo dato ricevuto */
  lastDataReceived?: Date;

  /** Ultimo errore */
  lastError?: Date;

  /** Numero totale cambiamenti ricevuti */
  totalChangesReceived: number;

  /** Numero reconnection */
  reconnectionCount: number;

  /** Latenza media (ms) */
  averageLatency?: number;
}

/**
 * Dati listener real-time
 * Per: payload cambiamenti real-time
 */
export interface FirestoreListenerData<T = any> {
  /** Tipo cambiamento */
  changeType: ChangeType;

  /** Documenti modificati */
  changedDocs: FirestoreDoc<T>[];

  /** Snapshot completo attuale */
  currentSnapshot: FirestoreDoc<T>[];

  /** Metadata cambiamento */
  changeMetadata: ChangeMetadata;
}

/**
 * Tipo cambiamento documento
 * Per: categorizzare cambiamenti real-time
 */
export type ChangeType =
  | "added"
  | "modified"
  | "removed"
  | "metadata-only"
  | "initial-load";

/**
 * Metadata cambiamento
 * Per: dettagli cambiamento ricevuto
 */
export interface ChangeMetadata {
  /** Cambiamento da cache */
  fromCache: boolean;

  /** Cambiamenti pending */
  hasPendingWrites: boolean;

  /** Timestamp cambiamento */
  timestamp: Date;

  /** Source cambiamento */
  source: "local" | "server" | "cache";

  /** Latenza cambiamento (ms) */
  latency?: number;
}

// =====================================================
// ❌ FIRESTORE ERROR HANDLING
// =====================================================

/**
 * Errore Firestore tipizzato
 * Per: gestione specifica errori Firestore
 * Basato su: error handling patterns utilizzati nell'app
 */
export interface FirestoreError {
  /** Codice errore Firestore */
  code: FirestoreErrorCode;

  /** Messaggio errore */
  message: string;

  /** Dettagli errore */
  details?: any;

  /** Operazione che ha causato errore */
  operation: FirestoreOperation;

  /** Path documento/collezione */
  path?: string;

  /** Query che ha fallito */
  query?: FirestoreQuery;

  /** Recuperabile con retry */
  recoverable: boolean;

  /** Suggerimento risoluzione */
  resolution?: string;

  /** Timestamp errore */
  timestamp: Date;
}

/**
 * Codici errore Firestore
 * Per: handling specifico per tipo errore
 */
export type FirestoreErrorCode =
  | "permission-denied"
  | "not-found"
  | "already-exists"
  | "resource-exhausted"
  | "failed-precondition"
  | "aborted"
  | "out-of-range"
  | "unimplemented"
  | "internal"
  | "unavailable"
  | "data-loss"
  | "unauthenticated"
  | "network-error"
  | "timeout"
  | "cancelled"
  | "unknown";

/**
 * Operazioni Firestore
 * Per: identificare operazione che ha fallito
 */
export type FirestoreOperation =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "query"
  | "listen"
  | "batch"
  | "transaction";

// =====================================================
// 🔄 FIRESTORE OPERATIONS
// =====================================================

/**
 * Batch Operation per multiple operazioni atomiche
 * Per: operazioni multiple sicure e atomiche
 */
export interface FirestoreBatch {
  /** ID univoco batch */
  id: string;

  /** Operazioni nel batch */
  operations: BatchOperation[];

  /** Committed batch */
  committed: boolean;

  /** Timestamp creazione */
  createdAt: Date;

  /** Timeout batch (ms) */
  timeout: number;
}

/**
 * Singola operazione in batch
 * Per: operazione atomica nel batch
 */
export interface BatchOperation {
  /** Tipo operazione */
  type: "create" | "update" | "delete";

  /** Path documento */
  path: string;

  /** Dati operazione */
  data?: any;

  /** Condizioni precondition */
  preconditions?: Precondition[];
}

/**
 * Precondizione per operazione
 * Per: conditional operations sicure
 */
export interface Precondition {
  /** Tipo precondizione */
  type:
    | "exists"
    | "not-exists"
    | "version-match"
    | "modified-before"
    | "modified-after";

  /** Valore precondizione */
  value?: any;
}

/**
 * Risultato operazione Firestore
 * Per: feedback operazioni CRUD
 */
export interface FirestoreOperationResult<T = any> {
  /** Operazione riuscita */
  success: boolean;

  /** Documento risultante */
  doc?: FirestoreDoc<T>;

  /** Documenti risultanti (per batch) */
  docs?: FirestoreDoc<T>[];

  /** Errore operazione */
  error?: FirestoreError;

  /** Metadata operazione */
  operationMetadata: OperationMetadata;

  /** Warning non bloccanti */
  warnings?: string[];
}

/**
 * Metadata operazione
 * Per: tracking performance operazioni
 */
export interface OperationMetadata {
  /** Timestamp inizio operazione */
  startedAt: Date;

  /** Timestamp fine operazione */
  completedAt: Date;

  /** Durata operazione (ms) */
  duration: number;

  /** Operazione da cache */
  fromCache: boolean;

  /** Documenti coinvolti */
  docsAffected: number;

  /** Bytes trasferiti */
  bytesTransferred?: number;

  /** Retry eseguiti */
  retryCount: number;
}

// =====================================================
// 🔄 OFFLINE & SYNC
// =====================================================

/**
 * Stato connessione Firestore
 * Per: gestione offline/online mode
 */
export interface FirestoreConnectionState {
  /** Online/offline */
  online: boolean;

  /** Ultima volta online */
  lastOnlineAt?: Date;

  /** Operazioni pending offline */
  pendingOperations: PendingOperation[];

  /** Sync in corso */
  syncing: boolean;

  /** Ultimo sync completo */
  lastFullSync?: Date;

  /** Errori sync */
  syncErrors: FirestoreError[];
}

/**
 * Operazione pending offline
 * Per: queue operazioni da sincronizzare
 */
export interface PendingOperation {
  /** ID operazione */
  id: string;

  /** Tipo operazione */
  type: FirestoreOperation;

  /** Path target */
  path: string;

  /** Dati operazione */
  data?: any;

  /** Timestamp creazione */
  createdAt: Date;

  /** Tentativi eseguiti */
  attempts: number;

  /** Priorità sync */
  priority: "high" | "medium" | "low";
}

/**
 * Configurazione sync Firestore
 * Per: comportamento sync offline/online
 */
export interface FirestoreSyncConfig {
  /** Modalità sync */
  mode: "auto" | "manual" | "disabled";

  /** Intervallo sync automatico (ms) */
  autoSyncInterval: number;

  /** Retry automatico operazioni fallite */
  autoRetryFailedOps: boolean;

  /** Max operazioni pending */
  maxPendingOps: number;

  /** Timeout operazioni (ms) */
  operationTimeout: number;

  /** Cache persistence */
  enablePersistence: boolean;

  /** Dimensione max cache (MB) */
  maxCacheSize: number;
}
