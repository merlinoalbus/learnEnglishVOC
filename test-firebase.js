// test-firebase.js - Test configurazione Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

console.log('🔥 Testing Firebase Configuration...');
console.log('Project ID:', firebaseConfig.projectId);

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Test Firestore
  const db = getFirestore(app);
  console.log('✅ Firestore initialized:', db.app.options.projectId);
  
  // Test Auth
  const auth = getAuth(app);
  console.log('✅ Auth initialized for project:', auth.app.options.projectId);
  
  console.log('🎉 All Firebase services ready!');
  
} catch (error) {
  console.error('❌ Firebase configuration error:', error);
  console.error('Check your .env file variables');
}