// src/services/firebaseService.js
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { STORAGE_CONFIG } from '../constants/appConstants';

class FirebaseService {
  constructor() {
    this.userId = null;
    this.unsubscribes = new Map();
    this.keys = STORAGE_CONFIG.keys;
  }

  // Initialize user session
  async initUser(user) {
    this.userId = user.uid;
    
    const userProfile = {
      email: user.email,
      displayName: user.displayName || 'User',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp()
    };
    
    await setDoc(doc(db, 'users', this.userId, 'profile', 'main'), userProfile, { merge: true });
    console.log('✅ Firebase user initialized:', user.email);
  }

  // Cleanup on logout
  cleanup() {
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes.clear();
    this.userId = null;
  }

  // Collection helpers
  getUserCollection(collectionName) {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(db, 'users', this.userId, collectionName);
  }

  getUserDoc(collectionName, docId = 'main') {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(db, 'users', this.userId, collectionName, docId);
  }

  // WORDS OPERATIONS
  async getWords() {
    try {
      if (!this.userId) return [];
      
      const wordsCollection = this.getUserCollection('words');
      const snapshot = await getDocs(query(wordsCollection, orderBy('english')));
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('❌ Error getting words:', error);
      return [];
    }
  }

  async addWord(wordData) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const wordsCollection = this.getUserCollection('words');
      const newWord = {
        ...wordData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(wordsCollection, newWord);
      
      return { 
        id: docRef.id, 
        ...wordData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error adding word:', error);
      throw error;
    }
  }

  async updateWord(wordId, wordData) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const wordRef = this.getUserDoc('words', wordId);
      const updateData = {
        ...wordData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(wordRef, updateData);
      
      return { 
        id: wordId, 
        ...wordData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error updating word:', error);
      throw error;
    }
  }

  async deleteWord(wordId) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const wordRef = this.getUserDoc('words', wordId);
      await deleteDoc(wordRef);
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting word:', error);
      throw error;
    }
  }

  // Real-time words subscription
  subscribeToWords(callback) {
    if (!this.userId) {
      callback([]);
      return () => {};
    }

    try {
      const wordsCollection = this.getUserCollection('words');
      const q = query(wordsCollection, orderBy('english'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const words = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        }));
        callback(words);
      }, (error) => {
        console.error('❌ Words subscription error:', error);
        callback([]);
      });
      
      this.unsubscribes.set('words', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error subscribing to words:', error);
      callback([]);
      return () => {};
    }
  }

  // STATS OPERATIONS
  async getStats() {
    try {
      if (!this.userId) return null;
      
      const statsRef = this.getUserDoc('stats');
      const snapshot = await getDoc(statsRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          ...data,
          lastStudyDate: data.lastStudyDate?.toDate?.() || data.lastStudyDate,
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return null;
    }
  }

  async updateStats(statsData) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const statsRef = this.getUserDoc('stats');
      const updateData = {
        ...statsData,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(statsRef, updateData, { merge: true });
      
      return {
        ...statsData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error updating stats:', error);
      throw error;
    }
  }

  // TEST HISTORY OPERATIONS
  async getTestHistory(limitCount = 100) {
    try {
      if (!this.userId) return [];
      
      const historyCollection = this.getUserCollection('testHistory');
      const q = query(
        historyCollection, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
    } catch (error) {
      console.error('❌ Error getting test history:', error);
      return [];
    }
  }

  async addTestResult(testData) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const historyCollection = this.getUserCollection('testHistory');
      const newTest = {
        ...testData,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(historyCollection, newTest);
      
      return { 
        id: docRef.id, 
        ...testData,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error adding test result:', error);
      throw error;
    }
  }

  // WORD PERFORMANCE OPERATIONS
  async getWordPerformance(wordId) {
    try {
      if (!this.userId) return null;
      
      const performanceRef = this.getUserDoc('wordPerformance', wordId);
      const snapshot = await getDoc(performanceRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        return {
          ...data,
          attempts: data.attempts?.map(attempt => ({
            ...attempt,
            timestamp: attempt.timestamp?.toDate?.() || attempt.timestamp
          })) || [],
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting word performance:', error);
      return null;
    }
  }

  async updateWordPerformance(wordId, performanceData) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const performanceRef = this.getUserDoc('wordPerformance', wordId);
      const updateData = {
        ...performanceData,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(performanceRef, updateData, { merge: true });
      
      return {
        ...performanceData,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error updating word performance:', error);
      throw error;
    }
  }

  async getAllWordPerformance() {
    try {
      if (!this.userId) return {};
      
      const performanceCollection = this.getUserCollection('wordPerformance');
      const snapshot = await getDocs(performanceCollection);
      
      const performance = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        performance[doc.id] = {
          ...data,
          attempts: data.attempts?.map(attempt => ({
            ...attempt,
            timestamp: attempt.timestamp?.toDate?.() || attempt.timestamp
          })) || [],
          updatedAt: data.updatedAt?.toDate?.() || new Date()
        };
      });
      
      return performance;
    } catch (error) {
      console.error('❌ Error getting all word performance:', error);
      return {};
    }
  }

  // BATCH OPERATIONS
  async batchImportWords(words) {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      const batch = writeBatch(db);
      const wordsCollection = this.getUserCollection('words');
      
      words.forEach(word => {
        const docRef = doc(wordsCollection);
        batch.set(docRef, {
          ...word,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('❌ Error batch importing words:', error);
      throw error;
    }
  }

  // MIGRATION FROM LOCALSTORAGE
  async migrateFromLocalStorage() {
    try {
      if (!this.userId) throw new Error('User not authenticated');
      
      console.log('🔄 Starting migration from localStorage...');
      
      const words = JSON.parse(localStorage.getItem(this.keys.words) || '[]');
      const stats = JSON.parse(localStorage.getItem(this.keys.stats) || '{}');
      const testHistory = JSON.parse(localStorage.getItem(this.keys.testHistory) || '[]');
      const wordPerformance = JSON.parse(localStorage.getItem(this.keys.wordPerformance) || '{}');

      let migratedCount = 0;

      // Migrate words
      if (words.length > 0) {
        await this.batchImportWords(words);
        migratedCount += words.length;
        console.log(`✅ Migrated ${words.length} words`);
      }

      // Migrate stats
      if (Object.keys(stats).length > 0) {
        await this.updateStats(stats);
        console.log('✅ Migrated stats');
      }

      // Migrate test history
      if (testHistory.length > 0) {
        const batch = writeBatch(db);
        const historyCollection = this.getUserCollection('testHistory');
        
        testHistory.forEach(test => {
          const docRef = doc(historyCollection);
          batch.set(docRef, {
            ...test,
            createdAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`✅ Migrated ${testHistory.length} test history entries`);
      }

      // Migrate word performance
      if (Object.keys(wordPerformance).length > 0) {
        const batch = writeBatch(db);
        
        Object.entries(wordPerformance).forEach(([wordId, performance]) => {
          const performanceRef = this.getUserDoc('wordPerformance', wordId);
          batch.set(performanceRef, {
            ...performance,
            updatedAt: serverTimestamp()
          });
        });
        
        await batch.commit();
        console.log(`✅ Migrated ${Object.keys(wordPerformance).length} word performance entries`);
      }

      console.log(`🎉 Migration completed!`);
      
      return {
        success: true,
        wordsCount: words.length,
        testsCount: testHistory.length,
        performanceCount: Object.keys(wordPerformance).length,
        hasStats: Object.keys(stats).length > 0
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
export default firebaseService;