import { collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "../config/firebase";

export interface DebugData {
  timestamp: string;
  currentUser: {
    uid: string | null;
    email: string | null;
  };
  collections: {
    detailedTestSessions: any[];
    words: any[];
    performance: any[];
    statistics: any[];
  };
}

export const extractDebugData = async (): Promise<DebugData> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Nessun utente autenticato");
    }

    const debugData: DebugData = {
      timestamp: new Date().toISOString(),
      currentUser: {
        uid: currentUser.uid,
        email: currentUser.email
      },
      collections: {
        detailedTestSessions: [],
        words: [],
        performance: [],
        statistics: []
      }
    };

    // Extract detailedTestSessions for current user
    try {
      const detailedTestSessionsSnapshot = await getDocs(collection(db, "detailedTestSessions"));
      debugData.collections.detailedTestSessions = detailedTestSessionsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.userId === currentUser.uid && data.deleted !== true;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } catch (error) {
      console.warn("Collection detailedTestSessions non trovata o errore:", error);
    }

    // Extract words - potrebbero essere globali o per utente
    try {
      const wordsSnapshot = await getDocs(collection(db, "words"));
      debugData.collections.words = wordsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Se hanno userId, filtra per utente corrente, altrimenti includile tutte (parole globali)
          return (!data.userId || data.userId === currentUser.uid) && data.deleted !== true;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } catch (error) {
      console.warn("Collection words non trovata o errore:", error);
    }

    // Extract performance for current user
    try {
      const performanceSnapshot = await getDocs(collection(db, "performance"));
      debugData.collections.performance = performanceSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Controlla se appartiene all'utente corrente e non è cancellato
          return (data.userId === currentUser.uid || 
                 doc.id.includes(currentUser.uid) || // ID potrebbe contenere userId
                 (data.attempts && Array.isArray(data.attempts))) && // O se ha attempts è probabilmente dell'utente
                 data.deleted !== true;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } catch (error) {
      console.warn("Collection performance non trovata o errore:", error);
    }

    // Extract statistics for current user
    try {
      const statisticsSnapshot = await getDocs(collection(db, "statistics"));
      debugData.collections.statistics = statisticsSnapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.userId === currentUser.uid && data.deleted !== true;
        })
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
    } catch (error) {
      console.warn("Collection statistics non trovata o errore:", error);
    }

    return debugData;
  } catch (error) {
    console.error("Errore nell'estrazione dei dati di debug:", error);
    throw error;
  }
};