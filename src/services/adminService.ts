import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { auth, adminAuth, db } from '../config/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs, query, where, deleteDoc, writeBatch } from 'firebase/firestore';
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
  
  // Save admin user info before processing
  const adminUser = auth.currentUser;
  if (!adminUser) {
    console.error('No admin user found');
    return { processed: 0, failed: 0 };
  }
  
  const adminUid = adminUser.uid;
  const adminEmail = adminUser.email;
  
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
        
        // Create the user account using admin auth instance
        // This prevents interfering with the main user session
        const userCredential = await createUserWithEmailAndPassword(
          adminAuth,
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
    
    // Clean up admin auth session after processing
    if (processed > 0) {
      console.log('Cleaning up admin auth session...');
      try {
        await adminAuth.signOut();
        console.log('Admin auth session cleaned up successfully');
      } catch (authError) {
        console.error('Failed to clean up admin auth session:', authError);
      }
    }
    
    return { processed, failed };
    
  } catch (error) {
    console.error('Error processing pending user creations:', error);
    
    // Clean up admin auth session even on error
    try {
      await adminAuth.signOut();
    } catch (authError) {
      console.error('Failed to clean up admin auth session:', authError);
    }
    
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

/**
 * Clean up admin operations collection
 */
export const cleanupAdminOperations = async (): Promise<{ deleted: number }> => {
  try {
    const adminOpsQuery = query(collection(db, 'admin_operations'));
    const adminOpsSnapshot = await getDocs(adminOpsQuery);
    
    const batch = writeBatch(db);
    let deleted = 0;
    
    adminOpsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleted++;
    });
    
    await batch.commit();
    console.log(`Cleaned up ${deleted} admin operations`);
    return { deleted };
  } catch (error) {
    console.error('Error cleaning up admin operations:', error);
    return { deleted: 0 };
  }
};

/**
 * Delete user completely (from both DB and Authentication)
 * This function attempts to delete from both Firestore and Authentication
 */
export const deleteUserComplete = async (userId: string, adminId: string): Promise<{success: boolean, authDeleted: boolean, message: string}> => {
  try {
    // First, get user data to get email (needed for authentication)
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', userId)));
    
    if (userDoc.empty) {
      return {
        success: false,
        authDeleted: false,
        message: 'Utente non trovato nel database'
      };
    }

    const userData = userDoc.docs[0].data();
    const userEmail = userData.email;

    // Delete from Firestore first
    const batch = writeBatch(db);

    // Delete user profile
    batch.delete(userRef);

    // Delete user preferences (always separate collection)
    const prefsRef = doc(db, 'user_preferences', userId);
    batch.delete(prefsRef);

    // Note: user_stats and user_profiles are now consolidated in the main users collection
    // No need to delete separate collections as they should not exist anymore

    // Delete user's data collections - comprehensive cleanup
    const userDataCollections = [
      'words', 
      'test_history', 
      'statistics',
      'performance',
      'user_achievements', 
      'user_sessions',
      'user_exports',
      'user_imports',
      'user_vocabulary',
      'user_progress',
      'user_feedback',
      'user_notifications'
    ];

    for (const collectionName of userDataCollections) {
      const userDataQuery = query(
        collection(db, collectionName),
        where('userId', '==', userId)
      );
      const userDataSnapshot = await getDocs(userDataQuery);

      userDataSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
    }

    // Clean up pending user creations for this user email
    const pendingUserQuery = query(
      collection(db, 'pending_user_creations'),
      where('email', '==', userEmail)
    );
    const pendingUserSnapshot = await getDocs(pendingUserQuery);
    
    pendingUserSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Clean up user invitations
    const invitationsQuery = query(
      collection(db, 'user_invitations'),
      where('email', '==', userEmail)
    );
    const invitationsSnapshot = await getDocs(invitationsQuery);
    
    invitationsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Log admin operation
    const operationRef = doc(collection(db, 'admin_operations'));
    batch.set(operationRef, {
      type: 'delete_user',
      targetUserId: userId,
      performedBy: adminId,
      timestamp: serverTimestamp(),
    });

    await batch.commit();
    console.log(`User ${userId} completely deleted from Firestore with comprehensive cleanup`);

    // Now try to delete from Authentication
    // Note: This is a workaround with limitations
    let authDeleted = false;
    let message = `Utente ${userEmail} eliminato completamente dal database.`;
    message += ' Eliminati anche: dati personali, statistiche, preferenze, inviti e attività in sospeso.';

    try {
      // We cannot delete other users from Authentication with client SDK
      // This is a Firebase security limitation
      console.warn('Cannot delete user from Authentication - Firebase client SDK limitation');
      message += ' NOTA: L\'utente deve essere eliminato manualmente da Firebase Authentication Console.';
    } catch (authError) {
      console.error('Error deleting user from Authentication:', authError);
      message += ' Errore nell\'eliminazione da Authentication.';
    }
    
    return {
      success: true,
      authDeleted,
      message
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      authDeleted: false,
      message: 'Errore nell\'eliminazione dell\'utente'
    };
  }
};