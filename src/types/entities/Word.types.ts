// =====================================================
// 📁 types/entities/Word.types.ts - Entità Word Completa e Metadata
// =====================================================

/**
 * Definizione completa dell'entità Word con tutti i campi utilizzati nell'app
 * Basato su: useWords.js struttura dati esistente
 * Integra: categorie da appConstants.js, validazione da EnhancedAddWordForm.js
 */

// =====================================================
// 🏷️ WORD CATEGORIES & CHAPTERS
// =====================================================

/**
 * Categorie predefinite per le parole - ESPANSE per migliore apprendimento
 * Organizzate per: facilitare memorizzazione, associazioni mentali e progressione logica
 * Basate su: principi pedagogici di acquisizione linguistica e memory techniques
 */
export const WORD_CATEGORIES = [
  // ===== VERBI - Organizzati per frequenza e complessità =====
  "VERBI_BASE", // be, have, do, go, come, get, make, take
  "VERBI_MOVIMENTO", // walk, run, jump, fly, swim, climb, dance
  "VERBI_AZIONE_QUOTIDIANA", // eat, drink, sleep, wake, work, study, play
  "VERBI_COMUNICAZIONE", // speak, talk, say, tell, ask, answer, listen
  "VERBI_PENSIERO", // think, know, understand, remember, forget, learn
  "VERBI_SENTIMENTI", // like, love, hate, want, need, prefer, enjoy
  "VERBI_IRREGOLARI_COMUNI", // go-went-gone, see-saw-seen, eat-ate-eaten
  "VERBI_IRREGOLARI_DIFFICILI", // bring-brought-brought, catch-caught-caught
  "VERBI_MODALI", // can, could, will, would, should, must, may
  "VERBI_FRASALI", // get up, give up, look for, turn on/off

  // ===== SOSTANTIVI - Per contesti e associazioni =====
  "CORPO_UMANO", // head, hand, foot, eye, nose, mouth, finger
  "FAMIGLIA_PARENTELA", // mother, father, sister, brother, uncle, aunt
  "CASA_STANZE", // kitchen, bedroom, bathroom, living room, garage
  "CASA_OGGETTI", // table, chair, bed, door, window, lamp, mirror
  "CIBO_BEVANDE", // bread, milk, water, coffee, fruit, vegetables
  "ANIMALI_DOMESTICI", // dog, cat, bird, fish, rabbit, hamster
  "ANIMALI_SELVATICI", // lion, elephant, monkey, snake, tiger, bear
  "VESTITI_ACCESSORI", // shirt, pants, shoes, hat, watch, glasses
  "TRASPORTI", // car, bus, train, plane, bike, boat, metro
  "NATURA_AMBIENTE", // tree, flower, mountain, river, sea, sun, moon
  "TEMPO_ATMOSFERICO", // rain, snow, wind, cloud, storm, sunshine
  "CITTA_LUOGHI", // street, park, school, hospital, shop, restaurant

  // ===== AGGETTIVI - Per descrizioni progressive =====
  "AGGETTIVI_BASE", // big, small, good, bad, new, old, hot, cold
  "COLORI", // red, blue, green, yellow, black, white, pink
  "FORME_DIMENSIONI", // round, square, long, short, wide, narrow, thick
  "DESCRIZIONI_FISICHE", // tall, short, fat, thin, beautiful, ugly, strong
  "PERSONALITA_CARATTERE", // kind, mean, funny, serious, smart, lazy, brave
  "STATI_EMOTIVI", // happy, sad, angry, excited, worried, calm, tired
  "QUALITA_OGGETTI", // expensive, cheap, fast, slow, easy, difficult
  "QUANTITA_MISURE", // much, many, little, few, some, all, none, half

  // ===== CONTESTI TEMATICI - Per immersione linguistica =====
  "SCUOLA_EDUCAZIONE", // teacher, student, book, pen, homework, exam
  "LAVORO_PROFESSIONI", // doctor, teacher, police, engineer, chef, artist
  "TECNOLOGIA_DIGITALE", // computer, phone, internet, email, website, app
  "SPORT_ATTIVITA", // football, tennis, swimming, running, gym, team
  "MUSICA_ARTE", // song, piano, guitar, painting, movie, dance
  "SHOPPING_DENARO", // money, price, buy, sell, expensive, cheap, store
  "VIAGGIO_VACANZE", // hotel, ticket, passport, luggage, tourist, map
  "SALUTE_MEDICINA", // doctor, hospital, medicine, sick, healthy, pain
  "CIBO_RISTORANTE", // menu, waiter, order, delicious, hungry, thirsty
  "TEMPO_CALENDARIO", // Monday, January, morning, afternoon, yesterday

  // ===== FUNZIONI LINGUISTICHE - Per costruzione frasi =====
  "PREPOSIZIONI", // in, on, at, under, over, between, next to
  "CONGIUNZIONI", // and, but, or, because, although, while, when
  "AVVERBI_TEMPO", // always, never, sometimes, often, already, yet
  "AVVERBI_MODO", // quickly, slowly, carefully, loudly, quietly
  "AVVERBI_LUOGO", // here, there, everywhere, nowhere, upstairs
  "PRONOMI_DETERMINANTI", // this, that, these, those, some, any, every
  "PAROLE_INTERROGATIVE", // what, where, when, why, how, who, which
  "NUMERI_MATEMATICA", // one, two, first, second, add, subtract, calculate

  // ===== LIVELLI AVANZATI - Per progressione =====
  "FORMALE_BUSINESS", // meeting, presentation, contract, negotiate, profit
  "ACCADEMICO_SCIENTIFICO", // research, theory, experiment, analysis, evidence
  "IDIOMI_ESPRESSIONI", // piece of cake, break a leg, it's raining cats
  "SLANG_INFORMALE", // cool, awesome, gonna, wanna, ain't, buddy
  "SINONIMI_RAFFINATI", // big→enormous, good→excellent, bad→terrible
  "TERMINI_TECNICI", // algorithm, database, programming, artificial

  // ===== SITUAZIONI COMUNICATIVE - Per pratica contestuale =====
  "SALUTI_PRESENTAZIONI", // hello, goodbye, nice to meet you, how are you
  "RICHIESTE_PERMESSI", // please, thank you, excuse me, I'm sorry
  "EMERGENZE_PROBLEMI", // help, emergency, problem, accident, call police
  "DIREZIONI_ORIENTAMENTO", // left, right, straight, north, south, map, GPS
  "HOTEL_ALLOGGIO", // room, key, reception, check-in, checkout, wifi
  "AEROPORTO_VOLO", // flight, gate, boarding, departure, arrival, delay
  "BANCA_SERVIZI", // account, withdraw, deposit, ATM, credit card
  "MEDICO_FARMACIA", // appointment, prescription, symptoms, pharmacy
] as const;

/**
 * Union type per le categorie
 * Basato su: constants utilizzate in WordsList.js per filtering
 */
export type WordCategory = (typeof WORD_CATEGORIES)[number];

/**
 * Metadata per categoria con styling e icone
 * Estratto da: constants/appConstants.js - CATEGORY_STYLES
 */
export interface WordCategoryMetadata {
  /** Colore gradiente per la categoria */
  color: string;
  /** Icona emoji per la categoria */
  icon: string;
  /** Colore background solido */
  bgColor: string;
  /** Gradiente background completo */
  bgGradient: string;
}

/**
 * Capitoli disponibili per organizzare le parole
 * Basato su: utilizzo chapter in useWords.js getAvailableChapters()
 */
export interface WordChapter {
  /** ID univoco del capitolo */
  id: string;
  /** Nome del capitolo */
  name: string;
  /** Descrizione opzionale del capitolo */
  description?: string;
  /** Ordine di visualizzazione */
  order?: number;
}

// =====================================================
// 📚 WORD ENTITY CORE
// =====================================================

/**
 * Entità Word principale
 * Basata su: struttura dati utilizzata in useWords.js
 * Include: tutti i campi da EnhancedAddWordForm.js
 * AGGIORNATA: con array per sentences, sinonimi e contrari
 */
export interface Word {
  /** ID univoco della parola - generato da: generateId() utility */
  id: string;

  /** Termine inglese - campo obbligatorio da EnhancedAddWordForm validation */
  english: string;

  /** Traduzione italiana - campo obbligatorio da EnhancedAddWordForm validation */
  italian: string;

  /** Categoria della parola - utilizzata in filtering WordsList.js */
  group?: WordCategory | string;

  /** Capitolo di appartenenza - utilizzato in ChapterTestSelector.js */
  chapter?: string;

  /** Frasi di esempio - array da 0 a N elementi per multiple frasi */
  sentences?: string[];

  /** Note aggiuntive - campo opzionale da EnhancedAddWordForm */
  notes?: string;

  /** Sinonimi della parola inglese - array da 0 a N elementi */
  synonyms?: string[];

  /** Contrari della parola inglese - array da 0 a N elementi */
  antonyms?: string[];

  /** Flag parola appresa - utilizzato in toggleWordLearned da useWords */
  learned: boolean;

  /** Flag parola difficile - utilizzato in toggleWordDifficult da useWords */
  difficult: boolean;

  /** Timestamp creazione - aggiunto in addWord da useWords */
  createdAt: Date;

  /** Timestamp ultima modifica - aggiornato in updateWord */
  updatedAt: Date;

  /** Metadata Firestore per sync (quando disponibile) - usa FirestoreDocMetadata generic */
  firestoreMetadata?: import("../infrastructure/Firestore.types").FirestoreDocMetadata;
}

// =====================================================
// 🔍 WORD FILTERING & SEARCH
// =====================================================

/**
 * Filtri disponibili per le parole
 * Basato su: logica filtering da WordsList.js component
 */
export interface WordFilters {
  /** Filtro per categoria */
  category?: WordCategory | string | null;

  /** Filtro per capitolo */
  chapter?: string | null;

  /** Filtro per stato appreso */
  learned?: boolean | null;

  /** Filtro per parole difficili */
  difficult?: boolean | null;

  /** Filtro di ricerca testuale - cerca in english, italian, notes */
  searchText?: string;

  /** Data creazione da */
  createdAfter?: Date;

  /** Data creazione fino a */
  createdBefore?: Date;
}

/**
 * Opzioni di ordinamento per le parole
 * Basato su: pattern sorting utilizzati nell'app
 */
export type WordSortOption =
  | "english-asc"
  | "english-desc"
  | "italian-asc"
  | "italian-desc"
  | "createdAt-asc"
  | "createdAt-desc"
  | "learned-first"
  | "difficult-first"
  | "chapter-asc";

/**
 * Configurazione ricerca e filtering
 * Utilizzato da: useFilters hook (da implementare nel gruppo UI)
 */
export interface WordSearchConfig {
  /** Filtri attivi */
  filters: WordFilters;

  /** Opzione di ordinamento */
  sortBy: WordSortOption;

  /** Numero elementi per pagina */
  pageSize: number;

  /** Pagina corrente */
  currentPage: number;
}

// =====================================================
// ✅ WORD VALIDATION
// =====================================================

/**
 * Regole di validazione per Word
 * Estratte da: validazione in EnhancedAddWordForm.js
 * AGGIORNATE: per supportare sentences[], synonyms[], antonyms[]
 */
export interface WordValidationRules {
  /** Lunghezza minima termine inglese */
  englishMinLength: number;

  /** Lunghezza massima termine inglese */
  englishMaxLength: number;

  /** Pattern regex per termine inglese - da EnhancedAddWordForm validation */
  englishPattern: RegExp;

  /** Lunghezza minima traduzione italiana */
  italianMinLength: number;

  /** Lunghezza massima traduzione italiana */
  italianMaxLength: number;

  /** Lunghezza massima singola frase esempio */
  sentenceMaxLength: number;

  /** Numero massimo frasi esempio */
  maxSentences: number;

  /** Lunghezza massima note */
  notesMaxLength: number;

  /** Lunghezza massima singolo sinonimo */
  synonymMaxLength: number;

  /** Numero massimo sinonimi */
  maxSynonyms: number;

  /** Lunghezza massima singolo contrario */
  antonymMaxLength: number;

  /** Numero massimo contrari */
  maxAntonyms: number;

  /** Pattern regex per sinonimi/contrari */
  synonymAntonymPattern: RegExp;

  /** Categorie valide */
  validCategories: readonly string[];
}

/**
 * Risultato validazione Word
 * Utilizzato da: form validation e hook validation
 */
export interface WordValidationResult {
  /** Validazione passata */
  isValid: boolean;

  /** Errori per campo */
  fieldErrors: Partial<Record<keyof Word, string>>;

  /** Errori generali */
  generalErrors: string[];

  /** Warning (non bloccanti) */
  warnings: string[];
}

/**
 * Schema validazione Word completo
 * Basato su: validazione utilizzata in EnhancedAddWordForm.js
 * AGGIORNATO: con tutte le nuove categorie espanse e campi array
 */
export const WORD_VALIDATION_SCHEMA: WordValidationRules = {
  englishMinLength: 2, // da EnhancedAddWordForm: formData.english.trim().length >= 2
  englishMaxLength: 100,
  englishPattern: /^[a-zA-ZÀ-ÿ\s'-]+$/, // da EnhancedAddWordForm: /^[a-zA-ZÀ-ÿ\s'-]+$/
  italianMinLength: 2, // da EnhancedAddWordForm: formData.italian.trim().length >= 2
  italianMaxLength: 100,
  sentenceMaxLength: 500, // Lunghezza massima per singola frase
  maxSentences: 5, // Massimo 5 frasi esempio
  notesMaxLength: 1000,
  synonymMaxLength: 50, // Lunghezza massima per singolo sinonimo
  maxSynonyms: 10, // Massimo 10 sinonimi
  antonymMaxLength: 50, // Lunghezza massima per singolo contrario
  maxAntonyms: 10, // Massimo 10 contrari
  synonymAntonymPattern: /^[a-zA-ZÀ-ÿ\s'-]+$/, // Stesso pattern delle parole
  validCategories: WORD_CATEGORIES,
};

// =====================================================
// 📊 WORD STATISTICS
// =====================================================

/**
 * Statistiche aggregate per le parole
 * Basate su: wordStats da useWords.js
 */
export interface WordStats {
  /** Totale parole */
  total: number;

  /** Parole apprese */
  learned: number;

  /** Parole da studiare */
  unlearned: number;

  /** Parole difficili */
  difficult: number;

  /** Parole normali */
  normal: number;

  /** Distribuzione per categoria */
  byCategory: Record<string, number>;

  /** Distribuzione per capitolo */
  byChapter: Record<string, number>;

  /** Percentuale completamento */
  completionPercentage: number;
}

/**
 * Statistiche per capitolo specifico
 * Utilizzate da: getChapterStats in useWords.js
 */
export interface ChapterStats {
  /** Nome capitolo */
  chapterName: string;

  /** Totale parole nel capitolo */
  totalWords: number;

  /** Parole apprese nel capitolo */
  learnedWords: number;

  /** Parole difficili nel capitolo */
  difficultWords: number;

  /** Percentuale completamento capitolo */
  completionPercentage: number;

  /** Ultima parola aggiunta */
  lastWordAdded?: Date;
}

// =====================================================
// 🔄 WORD OPERATIONS
// =====================================================

/**
 * Input per creazione nuova parola
 * Utilizzato da: addWord in useWords.js
 * AGGIORNATO: con array per sentences, synonyms, antonyms
 */
export interface CreateWordInput {
  english: string;
  italian: string;
  group?: string;
  chapter?: string;
  sentences?: string[];
  notes?: string;
  synonyms?: string[];
  antonyms?: string[];
  difficult?: boolean;
}

/**
 * Input per aggiornamento parola esistente
 * Utilizzato da: updateWord operation
 * AGGIORNATO: con array per sentences, synonyms, antonyms
 */
export interface UpdateWordInput extends Partial<CreateWordInput> {
  id: string;
  learned?: boolean;
}

/**
 * Input per importazione parole
 * Basato su: importWords da useWords.js
 */
export interface ImportWordsInput {
  words: CreateWordInput[];
  mergeStrategy: "replace" | "merge" | "skip-duplicates";
  validateWords: boolean;
}

/**
 * Risultato operazione importazione
 * Utilizzato da: feedback import operation
 */
export interface ImportWordsResult {
  imported: number;
  skipped: number;
  errors: string[];
  duplicates: number;
  invalidWords: Array<{
    word: CreateWordInput;
    errors: string[];
  }>;
}

// =====================================================
// 📤 WORD EXPORT/BACKUP
// =====================================================

/**
 * Configurazione export parole
 * Basata su: export functionality da JSONManager.js
 */
export interface WordExportConfig {
  /** Includi parole apprese */
  includeLearned: boolean;

  /** Includi parole difficili */
  includeDifficult: boolean;

  /** Filtri per export */
  filters?: WordFilters;

  /** Includi metadata */
  includeMetadata: boolean;

  /** Formato export */
  format: "json" | "csv" | "excel";
}

/**
 * Dati export completi
 * Utilizzati da: export operation in JSONManager.js
 */
export interface WordExportData {
  /** Parole esportate */
  words: Word[];

  /** Data export */
  exportDate: string;

  /** Metadata export */
  metadata: {
    totalWords: number;
    chapters: string[];
    groups: string[];
    learnedCount: number;
    difficultCount: number;
    appVersion: string;
    exportFormat: string;
  };

  /** Configurazione utilizzata */
  exportConfig: WordExportConfig;
}

// =====================================================
// 🎨 CATEGORY STYLES ESPANSI - Per tutte le nuove categorie
// =====================================================

/**
 * Metadata styling per tutte le categorie espanse
 * Organizzati per: riconoscimento visivo, raggruppamento logico e user experience
 * Include: gradiente colori, icone mnemoniche, temi coerenti per gruppi correlati
 */
export const EXPANDED_CATEGORY_STYLES: Record<string, WordCategoryMetadata> = {
  // ===== VERBI - Tonalità rosse/arancioni (azione, dinamismo) =====
  VERBI_BASE: {
    color: "from-red-400 via-red-500 to-red-600",
    icon: "⚡",
    bgColor: "bg-red-500",
    bgGradient: "bg-gradient-to-br from-red-500 to-orange-600",
  },
  VERBI_MOVIMENTO: {
    color: "from-orange-400 via-orange-500 to-red-500",
    icon: "🏃",
    bgColor: "bg-orange-500",
    bgGradient: "bg-gradient-to-br from-orange-500 to-red-500",
  },
  VERBI_AZIONE_QUOTIDIANA: {
    color: "from-amber-400 via-orange-500 to-red-500",
    icon: "🔄",
    bgColor: "bg-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-500 to-orange-500",
  },
  VERBI_COMUNICAZIONE: {
    color: "from-red-500 via-pink-500 to-purple-500",
    icon: "💬",
    bgColor: "bg-red-500",
    bgGradient: "bg-gradient-to-br from-red-500 to-pink-500",
  },
  VERBI_PENSIERO: {
    color: "from-purple-400 via-purple-500 to-red-500",
    icon: "🧠",
    bgColor: "bg-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-red-500",
  },
  VERBI_SENTIMENTI: {
    color: "from-pink-400 via-red-400 to-red-500",
    icon: "❤️",
    bgColor: "bg-pink-500",
    bgGradient: "bg-gradient-to-br from-pink-500 to-red-500",
  },
  VERBI_IRREGOLARI_COMUNI: {
    color: "from-red-500 via-red-600 to-red-700",
    icon: "🔄",
    bgColor: "bg-red-600",
    bgGradient: "bg-gradient-to-br from-red-600 to-pink-600",
  },
  VERBI_IRREGOLARI_DIFFICILI: {
    color: "from-red-600 via-red-700 to-red-800",
    icon: "⚠️",
    bgColor: "bg-red-700",
    bgGradient: "bg-gradient-to-br from-red-700 to-red-900",
  },
  VERBI_MODALI: {
    color: "from-indigo-400 via-red-500 to-red-600",
    icon: "🎭",
    bgColor: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-red-500",
  },
  VERBI_FRASALI: {
    color: "from-yellow-400 via-orange-500 to-red-500",
    icon: "🔗",
    bgColor: "bg-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-500 to-red-500",
  },

  // ===== SOSTANTIVI - Tonalità blu (concretezza, oggettività) =====
  CORPO_UMANO: {
    color: "from-blue-400 via-blue-500 to-blue-600",
    icon: "👤",
    bgColor: "bg-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
  },
  FAMIGLIA_PARENTELA: {
    color: "from-pink-300 via-pink-400 to-blue-500",
    icon: "👨‍👩‍👧‍👦",
    bgColor: "bg-pink-400",
    bgGradient: "bg-gradient-to-br from-pink-400 to-blue-500",
  },
  CASA_STANZE: {
    color: "from-amber-400 via-yellow-500 to-blue-500",
    icon: "🏠",
    bgColor: "bg-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-500 to-blue-500",
  },
  CASA_OGGETTI: {
    color: "from-brown-400 via-amber-500 to-blue-500",
    icon: "🪑",
    bgColor: "bg-amber-600",
    bgGradient: "bg-gradient-to-br from-amber-600 to-blue-500",
  },
  CIBO_BEVANDE: {
    color: "from-green-400 via-yellow-500 to-blue-500",
    icon: "🍎",
    bgColor: "bg-green-500",
    bgGradient: "bg-gradient-to-br from-green-500 to-blue-500",
  },
  ANIMALI_DOMESTICI: {
    color: "from-orange-400 via-amber-500 to-blue-500",
    icon: "🐕",
    bgColor: "bg-orange-500",
    bgGradient: "bg-gradient-to-br from-orange-500 to-blue-500",
  },
  ANIMALI_SELVATICI: {
    color: "from-green-400 via-emerald-500 to-blue-600",
    icon: "🦁",
    bgColor: "bg-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-blue-600",
  },
  VESTITI_ACCESSORI: {
    color: "from-purple-400 via-pink-500 to-blue-500",
    icon: "👕",
    bgColor: "bg-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-blue-500",
  },
  TRASPORTI: {
    color: "from-blue-400 via-cyan-500 to-blue-600",
    icon: "🚗",
    bgColor: "bg-cyan-500",
    bgGradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
  },
  NATURA_AMBIENTE: {
    color: "from-green-400 via-emerald-500 to-blue-500",
    icon: "🌳",
    bgColor: "bg-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-blue-500",
  },
  TEMPO_ATMOSFERICO: {
    color: "from-sky-400 via-blue-500 to-indigo-600",
    icon: "☀️",
    bgColor: "bg-sky-500",
    bgGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
  CITTA_LUOGHI: {
    color: "from-slate-400 via-blue-500 to-indigo-600",
    icon: "🏙️",
    bgColor: "bg-slate-500",
    bgGradient: "bg-gradient-to-br from-slate-500 to-blue-600",
  },

  // ===== AGGETTIVI - Tonalità verdi (qualità, caratteristiche) =====
  AGGETTIVI_BASE: {
    color: "from-green-400 via-green-500 to-green-600",
    icon: "🎨",
    bgColor: "bg-green-500",
    bgGradient: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  COLORI: {
    color: "from-rainbow-400 via-pink-500 to-purple-600",
    icon: "🌈",
    bgColor: "bg-pink-500",
    bgGradient: "bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500",
  },
  FORME_DIMENSIONI: {
    color: "from-indigo-400 via-blue-500 to-green-600",
    icon: "📐",
    bgColor: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-green-600",
  },
  DESCRIZIONI_FISICHE: {
    color: "from-teal-400 via-teal-500 to-green-600",
    icon: "👤",
    bgColor: "bg-teal-500",
    bgGradient: "bg-gradient-to-br from-teal-500 to-green-600",
  },
  PERSONALITA_CARATTERE: {
    color: "from-purple-400 via-pink-500 to-green-600",
    icon: "🎭",
    bgColor: "bg-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-green-600",
  },
  STATI_EMOTIVI: {
    color: "from-yellow-400 via-pink-500 to-green-600",
    icon: "😊",
    bgColor: "bg-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-500 to-green-600",
  },
  QUALITA_OGGETTI: {
    color: "from-gray-400 via-slate-500 to-green-600",
    icon: "⭐",
    bgColor: "bg-slate-500",
    bgGradient: "bg-gradient-to-br from-slate-500 to-green-600",
  },
  QUANTITA_MISURE: {
    color: "from-blue-400 via-indigo-500 to-green-600",
    icon: "🔢",
    bgColor: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-green-600",
  },

  // ===== CONTESTI TEMATICI - Tonalità specifiche per tema =====
  SCUOLA_EDUCAZIONE: {
    color: "from-yellow-400 via-amber-500 to-orange-600",
    icon: "🎓",
    bgColor: "bg-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-500 to-orange-600",
  },
  LAVORO_PROFESSIONI: {
    color: "from-indigo-400 via-indigo-500 to-blue-600",
    icon: "💼",
    bgColor: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-blue-600",
  },
  TECNOLOGIA_DIGITALE: {
    color: "from-cyan-400 via-blue-500 to-purple-600",
    icon: "💻",
    bgColor: "bg-cyan-500",
    bgGradient: "bg-gradient-to-br from-cyan-500 to-purple-600",
  },
  SPORT_ATTIVITA: {
    color: "from-orange-400 via-red-500 to-pink-600",
    icon: "⚽",
    bgColor: "bg-orange-500",
    bgGradient: "bg-gradient-to-br from-orange-500 to-red-600",
  },
  MUSICA_ARTE: {
    color: "from-purple-400 via-pink-500 to-rose-600",
    icon: "🎵",
    bgColor: "bg-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-pink-600",
  },
  SHOPPING_DENARO: {
    color: "from-green-400 via-emerald-500 to-teal-600",
    icon: "💰",
    bgColor: "bg-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  VIAGGIO_VACANZE: {
    color: "from-sky-400 via-cyan-500 to-blue-600",
    icon: "✈️",
    bgColor: "bg-sky-500",
    bgGradient: "bg-gradient-to-br from-sky-500 to-blue-600",
  },
  SALUTE_MEDICINA: {
    color: "from-red-400 via-pink-500 to-rose-600",
    icon: "🏥",
    bgColor: "bg-red-500",
    bgGradient: "bg-gradient-to-br from-red-500 to-pink-600",
  },
  CIBO_RISTORANTE: {
    color: "from-amber-400 via-orange-500 to-red-600",
    icon: "🍽️",
    bgColor: "bg-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-500 to-red-600",
  },
  TEMPO_CALENDARIO: {
    color: "from-indigo-400 via-purple-500 to-pink-600",
    icon: "📅",
    bgColor: "bg-indigo-500",
    bgGradient: "bg-gradient-to-br from-indigo-500 to-purple-600",
  },

  // ===== FUNZIONI LINGUISTICHE - Tonalità neutre/grigie =====
  PREPOSIZIONI: {
    color: "from-slate-400 via-gray-500 to-zinc-600",
    icon: "🔗",
    bgColor: "bg-slate-500",
    bgGradient: "bg-gradient-to-br from-slate-500 to-gray-600",
  },
  CONGIUNZIONI: {
    color: "from-gray-400 via-slate-500 to-zinc-600",
    icon: "🔀",
    bgColor: "bg-gray-500",
    bgGradient: "bg-gradient-to-br from-gray-500 to-slate-600",
  },
  AVVERBI_TEMPO: {
    color: "from-violet-400 via-purple-500 to-indigo-600",
    icon: "⏰",
    bgColor: "bg-violet-500",
    bgGradient: "bg-gradient-to-br from-violet-500 to-indigo-600",
  },
  AVVERBI_MODO: {
    color: "from-emerald-400 via-teal-500 to-cyan-600",
    icon: "🎯",
    bgColor: "bg-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-cyan-600",
  },
  AVVERBI_LUOGO: {
    color: "from-blue-400 via-indigo-500 to-purple-600",
    icon: "📍",
    bgColor: "bg-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-purple-600",
  },
  PRONOMI_DETERMINANTI: {
    color: "from-stone-400 via-neutral-500 to-gray-600",
    icon: "👆",
    bgColor: "bg-stone-500",
    bgGradient: "bg-gradient-to-br from-stone-500 to-neutral-600",
  },
  PAROLE_INTERROGATIVE: {
    color: "from-amber-400 via-yellow-500 to-orange-600",
    icon: "❓",
    bgColor: "bg-amber-500",
    bgGradient: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  NUMERI_MATEMATICA: {
    color: "from-blue-400 via-cyan-500 to-teal-600",
    icon: "🔢",
    bgColor: "bg-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-teal-600",
  },

  // ===== LIVELLI AVANZATI - Tonalità intense/premium =====
  FORMALE_BUSINESS: {
    color: "from-gray-600 via-slate-700 to-zinc-800",
    icon: "🏢",
    bgColor: "bg-gray-700",
    bgGradient: "bg-gradient-to-br from-gray-700 to-slate-800",
  },
  ACCADEMICO_SCIENTIFICO: {
    color: "from-indigo-600 via-blue-700 to-purple-800",
    icon: "🔬",
    bgColor: "bg-indigo-700",
    bgGradient: "bg-gradient-to-br from-indigo-700 to-purple-800",
  },
  IDIOMI_ESPRESSIONI: {
    color: "from-pink-500 via-rose-600 to-red-700",
    icon: "🎭",
    bgColor: "bg-pink-600",
    bgGradient: "bg-gradient-to-br from-pink-600 to-red-700",
  },
  SLANG_INFORMALE: {
    color: "from-lime-400 via-green-500 to-emerald-600",
    icon: "😎",
    bgColor: "bg-lime-500",
    bgGradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
  },
  SINONIMI_RAFFINATI: {
    color: "from-violet-500 via-purple-600 to-indigo-700",
    icon: "✨",
    bgColor: "bg-violet-600",
    bgGradient: "bg-gradient-to-br from-violet-600 to-indigo-700",
  },
  TERMINI_TECNICI: {
    color: "from-cyan-500 via-blue-600 to-indigo-700",
    icon: "⚙️",
    bgColor: "bg-cyan-600",
    bgGradient: "bg-gradient-to-br from-cyan-600 to-indigo-700",
  },

  // ===== SITUAZIONI COMUNICATIVE - Tonalità calde/sociali =====
  SALUTI_PRESENTAZIONI: {
    color: "from-yellow-400 via-orange-500 to-pink-600",
    icon: "👋",
    bgColor: "bg-yellow-500",
    bgGradient: "bg-gradient-to-br from-yellow-500 to-pink-600",
  },
  RICHIESTE_PERMESSI: {
    color: "from-green-400 via-teal-500 to-blue-600",
    icon: "🙏",
    bgColor: "bg-green-500",
    bgGradient: "bg-gradient-to-br from-green-500 to-blue-600",
  },
  EMERGENZE_PROBLEMI: {
    color: "from-red-500 via-orange-600 to-yellow-600",
    icon: "🚨",
    bgColor: "bg-red-600",
    bgGradient: "bg-gradient-to-br from-red-600 to-orange-600",
  },
  DIREZIONI_ORIENTAMENTO: {
    color: "from-blue-400 via-cyan-500 to-emerald-600",
    icon: "🧭",
    bgColor: "bg-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-emerald-600",
  },
  HOTEL_ALLOGGIO: {
    color: "from-purple-400 via-indigo-500 to-blue-600",
    icon: "🏨",
    bgColor: "bg-purple-500",
    bgGradient: "bg-gradient-to-br from-purple-500 to-blue-600",
  },
  AEROPORTO_VOLO: {
    color: "from-sky-400 via-blue-500 to-indigo-600",
    icon: "✈️",
    bgColor: "bg-sky-500",
    bgGradient: "bg-gradient-to-br from-sky-500 to-indigo-600",
  },
  BANCA_SERVIZI: {
    color: "from-emerald-400 via-green-500 to-teal-600",
    icon: "🏦",
    bgColor: "bg-emerald-500",
    bgGradient: "bg-gradient-to-br from-emerald-500 to-teal-600",
  },
  MEDICO_FARMACIA: {
    color: "from-red-400 via-rose-500 to-pink-600",
    icon: "💊",
    bgColor: "bg-red-500",
    bgGradient: "bg-gradient-to-br from-red-500 to-pink-600",
  },

  // ===== DEFAULT FALLBACK =====
  DEFAULT: {
    color: "from-blue-400 via-blue-500 to-blue-600",
    icon: "📚",
    bgColor: "bg-blue-500",
    bgGradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
  },
};
