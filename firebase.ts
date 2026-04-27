import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  type User
} from 'firebase/auth';
import { 
  initializeFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  or, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp,
  addDoc,
  getDocFromServer
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import appletConfig from './firebase-applet-config.json';

// Helper to get environment variables safely in both Vite and Node environments
const getEnv = (key: string) => {
  try {
    // @ts-expect-error - Vite specific environment variables
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-expect-error - Vite specific environment variables
      return import.meta.env[key];
    }
  } catch {
    // Ignore error if import.meta is not available
  }
  
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return undefined;
};

const config = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || appletConfig.apiKey,
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || appletConfig.authDomain,
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || appletConfig.projectId,
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || appletConfig.storageBucket,
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || appletConfig.messagingSenderId,
  appId: getEnv('VITE_FIREBASE_APP_ID') || appletConfig.appId,
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || appletConfig.measurementId,
  firestoreDatabaseId: getEnv('VITE_FIREBASE_DATABASE_ID') || appletConfig.firestoreDatabaseId || '(default)'
};

// Log config for debugging (only in browser console, non-production)
if (typeof window !== 'undefined' && getEnv('NODE_ENV') !== 'production') {
  console.log('Firebase Config being used:', {
    ...config,
    apiKey: '***' // Hide sensitive part
  });
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(config) : getApp();
const auth = getAuth(app);

// Use initializeFirestore with settings to solve Internal Assertion errors in some environments
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, config.firestoreDatabaseId);

// Messaging setup (only in browser)
let messaging: any = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn('Firebase Messaging not supported in this browser:', err);
  }
}

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    // Detection for mobile/Safari to use redirect instead of popup
    const isMobile = typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isMobile || isSafari) {
      console.log('Mobile/Safari detected. Using signInWithRedirect.');
      await signInWithRedirect(auth, googleProvider);
      return; // Will redirect away from page
    }

    const result = await signInWithPopup(auth, googleProvider).catch(async (err) => {
      // Fallback if popup is blocked
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        console.warn('Popup blocked, falling back to redirect...');
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    });
    return result?.user;
  } catch (error) {
    console.error('Error during Google login:', error);
    throw error;
  }
};

export const handleRedirectResult = () => getRedirectResult(auth);

export const loginWithEmail = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
export const registerWithEmail = (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass);
export const verifyEmail = () => auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.reject('No user logged in');
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
export { updateProfile };

export const logout = () => signOut(auth);

// Error Handling Spec for Firestore Operations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Re-exporting Firebase functions explicitly
export { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  or, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp, 
  onAuthStateChanged, 
  addDoc, 
  getToken, 
  onMessage, 
  getDocFromServer,
  type User
};

export { auth, db, messaging, app };
