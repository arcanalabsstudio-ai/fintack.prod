import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

// Firebase configuration - Permite variables de entorno VITE_FIREBASE_* en Vercel o fallback directo
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fintack-prod",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:930349565104:web:1fdd49854de4bcb863e775",
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4JPVxaFXexEGcdDWfwC7o783A0YFjK6M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fintack-prod.firebaseapp.com",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "fintack-prod.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "930349565104",
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Configure local session persistence explicitly
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence error:', err);
});

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export {
  signInAnonymously,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
};

export type { User };