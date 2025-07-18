import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import type { UserRole } from '../types/entities/User.types';

export interface CreateUserRequest {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
}

export interface PendingUserCreation {
  email: string;
  displayName: string;
  password: string;
  role: UserRole;
  createdAt: any;
  createdBy: string;
  status: 'pending';
}

/**
 * Add user to creation queue (will be processed on next admin login)
 */
export const createUserAsAdmin = async (userData: CreateUserRequest, adminId: string): Promise<boolean> => {
  try {
    const queueId = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingUser: PendingUserCreation = {
      email: userData.email,
      displayName: userData.displayName,
      password: userData.password,
      role: userData.role,
      createdAt: serverTimestamp(),
      createdBy: adminId,
      status: 'pending'
    };

    await setDoc(doc(db, 'pending_user_creations', queueId), pendingUser);
    return true;
  } catch (error) {
    console.error('Error adding user to creation queue:', error);
    throw error;
  }
};

/**
 * Process pending user creations - unified function for both login types
 */
export const processPendingUserCreations = async (
  authMethod: 'email' | 'google' = 'google',
  credentials?: { email: string; password: string }
): Promise<{processed: number, failed: number}> => {
  console.log(`Starting processPendingUserCreations with ${authMethod} auth...`);
  let processed = 0;
  let failed = 0;
  
  try {
    // Get all pending creations
    const pendingQuery = query(
      collection(db, 'pending_user_creations'),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    console.log(`Found ${pendingSnapshot.size} pending user creations`);
    
    if (pendingSnapshot.empty) {
      return { processed: 0, failed: 0 };
    }

    // Process each pending user
    for (const pendingDoc of pendingSnapshot.docs) {
      const pendingData = pendingDoc.data() as PendingUserCreation;
      
      try {
        console.log(`Creating user: ${pendingData.email}`);
        
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          pendingData.email,
          pendingData.password
        );
        
        const newUser = userCredential.user;
        
        // Initialize user data using service function
        await initializeNewUserData(newUser.uid, pendingData);
        
        // Remove from pending queue
        await deleteDoc(doc(db, 'pending_user_creations', pendingDoc.id));
        processed++;
        
        console.log(`User ${pendingData.email} created successfully`);
        
      } catch (userError: any) {
        console.error(`Failed to create user ${pendingData.email}:`, userError);
        
        // If email already exists, remove from queue anyway
        if (userError.code === 'auth/email-already-in-use') {
          console.log(`Email ${pendingData.email} already exists, removing from queue`);
          await deleteDoc(doc(db, 'pending_user_creations', pendingDoc.id));
        }
        
        failed++;
      }
    }
    
    console.log(`Processing complete. Processed: ${processed}, Failed: ${failed}`);
    
    // Handle re-authentication based on method
    if (authMethod === 'email' && credentials) {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    } else {
      await auth.signOut();
      console.log('Signed out after user creation - admin will need to login again');
    }
    
    return { processed, failed };
    
  } catch (error) {
    console.error('Error processing pending user creations:', error);
    return { processed, failed };
  }
};

/**
 * Initialize new user data in Firestore
 */
const initializeNewUserData = async (uid: string, userData: PendingUserCreation): Promise<void> => {
  // Create user profile
  const userProfile = {
    id: uid,
    email: userData.email,
    displayName: userData.displayName,
    role: userData.role,
    emailVerified: false,
    isActive: true,
    createdAt: serverTimestamp(),
    lastLoginAt: null,
    photoURL: null,
    providerId: 'password'
  };
  
  await setDoc(doc(db, 'users', uid), userProfile);
  
  // Initialize user preferences
  await setDoc(doc(db, 'user_preferences', uid), {
    theme: 'light',
    notifications: {
      email: true,
      push: false,
      inApp: true
    },
    privacy: {
      showProfile: true,
      showStats: false
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  
  // Initialize user stats
  await setDoc(doc(db, 'user_stats', uid), {
    totalTests: 0,
    totalWords: 0,
    averageScore: 0,
    lastTestDate: null,
    streakDays: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

// Legacy function for backward compatibility
export const processPendingUserCreationsForGoogle = processPendingUserCreations;

/**
 * Send password reset email - SAME as user reset password
 */
export const resetPasswordAsAdmin = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Generate a secure random password
 */
export const generateSecurePassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

/**
 * Get count of pending user creations
 */
export const getPendingUserCreationsCount = async (): Promise<number> => {
  try {
    const pendingQuery = query(
      collection(db, 'pending_user_creations'),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    return pendingSnapshot.size;
  } catch (error) {
    console.error('Error getting pending user creations count:', error);
    return 0;
  }
};