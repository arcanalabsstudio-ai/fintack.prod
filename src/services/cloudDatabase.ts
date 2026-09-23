import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { 
  db, 
  auth, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  signInWithPopup,
  googleProvider,
  updateProfile
} from '../lib/firebase';
import { Transaction, TaxSettings, PlanType, ActivityLogItem } from '../types';
import { DEFAULT_TAX_SETTINGS } from '../data/constants';

export interface CloudUserDoc {
  userId: string;
  email?: string | null;
  username?: string;
  plan: PlanType;
  taxSettings: TaxSettings;
  termsAccepted: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SyncStatus = 'connecting' | 'synced' | 'saving' | 'offline' | 'error';

class CloudDatabaseService {
  private currentUser: User | null = null;
  private txUnsubscribe: Unsubscribe | null = null;
  private logsUnsubscribe: Unsubscribe | null = null;
  private userDocUnsubscribe: Unsubscribe | null = null;

  public async initAuth(
    onUserChange: (user: User | null) => void,
    onStatusChange?: (status: SyncStatus) => void
  ): Promise<() => void> {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        this.currentUser = user;
        onUserChange(user);
        if (onStatusChange) onStatusChange('synced');
      } else {
        // If an anonymous session exists from earlier versions, sign out cleanly
        if (user && user.isAnonymous) {
          try {
            await fbSignOut(auth);
          } catch (e) {
            // ignore
          }
        }
        this.currentUser = null;
        onUserChange(null);
        if (onStatusChange) onStatusChange('offline');
      }
    });

    return unsubscribeAuth;
  }

  public getCurrentUser(): User | null {
    return (this.currentUser && !this.currentUser.isAnonymous) ? this.currentUser : null;
  }

  public async signInWithEmail(email: string, pass: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    this.currentUser = cred.user;
    return cred.user;
  }

  public async signUpWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, { displayName });
      } catch (e) {
        console.warn('Could not update profile displayName:', e);
      }
    }
    this.currentUser = cred.user;
    return cred.user;
  }

  public async signInWithGoogle(): Promise<User> {
    const cred = await signInWithPopup(auth, googleProvider);
    this.currentUser = cred.user;
    return cred.user;
  }

  public async signOut(): Promise<void> {
    this.cleanup();
    await fbSignOut(auth);
    this.currentUser = null;
  }

  // --- USER PROFILE & SETTINGS ---
  private isDevUser(userId: string): boolean {
    return userId.startsWith('dev-');
  }

  public async getUserProfile(userId: string): Promise<CloudUserDoc | null> {
    if (this.isDevUser(userId)) return null;
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as CloudUserDoc;
      }
      return null;
    } catch (e) {
      console.error('Error fetching user profile from cloud:', e);
      return null;
    }
  }

  public async saveUserProfile(
    userId: string,
    data: {
      username?: string;
      plan?: PlanType;
      taxSettings?: TaxSettings;
      termsAccepted?: boolean;
      onboardingCompleted?: boolean;
      email?: string | null;
    }
  ): Promise<void> {
    if (this.isDevUser(userId)) return;
    try {
      const userRef = doc(db, 'users', userId);
      const now = new Date().toISOString();
      await setDoc(
        userRef,
        {
          userId,
          ...data,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Error saving user profile to cloud:', e);
    }
  }

  public subscribeToUserProfile(
    userId: string,
    callback: (data: CloudUserDoc | null) => void
  ): () => void {
    if (this.isDevUser(userId)) return () => {};
    if (this.userDocUnsubscribe) {
      this.userDocUnsubscribe();
    }
    const userRef = doc(db, 'users', userId);
    this.userDocUnsubscribe = onSnapshot(
      userRef,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as CloudUserDoc);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn('Error listening to user profile:', error);
      }
    );
    return this.userDocUnsubscribe;
  }

  // --- TRANSACTIONS ---
  public subscribeToTransactions(
    userId: string,
    onData: (txs: Transaction[]) => void,
    onInitialEmpty?: () => void
  ): () => void {
    if (this.isDevUser(userId)) return () => {};
    if (this.txUnsubscribe) {
      this.txUnsubscribe();
    }

    const txCollection = collection(db, 'users', userId, 'transactions');
    const txQuery = query(txCollection, orderBy('date', 'desc'));

    this.txUnsubscribe = onSnapshot(
      txQuery,
      (snapshot) => {
        if (snapshot.empty) {
          onData([]);
          return;
        }

        const items: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<Transaction, 'id'>) });
        });
        onData(items);
      },
      (err) => {
        console.warn('Error subscribing to cloud transactions:', err);
      }
    );

    return this.txUnsubscribe;
  }

  public async saveTransaction(userId: string, tx: Transaction): Promise<void> {
    if (this.isDevUser(userId)) return;
    try {
      const txRef = doc(db, 'users', userId, 'transactions', tx.id);
      await setDoc(txRef, {
        ...tx,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.error('Error saving transaction to cloud:', e);
      throw e;
    }
  }

  public async deleteTransaction(userId: string, txId: string): Promise<void> {
    if (this.isDevUser(userId)) return;
    try {
      const txRef = doc(db, 'users', userId, 'transactions', txId);
      await deleteDoc(txRef);
    } catch (e) {
      console.error('Error deleting transaction from cloud:', e);
      throw e;
    }
  }

  public async seedInitialTransactions(userId: string, initialTxs: Transaction[] = []): Promise<void> {
    if (this.isDevUser(userId)) return;
    if (!initialTxs || initialTxs.length === 0) return;
    try {
      const batch = writeBatch(db);
      initialTxs.forEach((tx) => {
        const txRef = doc(db, 'users', userId, 'transactions', tx.id);
        batch.set(txRef, {
          ...tx,
          createdAt: tx.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
      await batch.commit();
    } catch (e) {
      console.error('Error seeding initial transactions to cloud:', e);
    }
  }

  // --- ACTIVITY LOGS ---
  public subscribeToActivityLogs(
    userId: string,
    onData: (logs: ActivityLogItem[]) => void
  ): () => void {
    if (this.isDevUser(userId)) return () => {};
    if (this.logsUnsubscribe) {
      this.logsUnsubscribe();
    }

    const logsCollection = collection(db, 'users', userId, 'activity_logs');
    const logsQuery = query(logsCollection, orderBy('timestamp', 'desc'));

    this.logsUnsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const items: ActivityLogItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...(docSnap.data() as Omit<ActivityLogItem, 'id'>) });
        });
        if (items.length > 0) {
          onData(items.slice(0, 15));
        }
      },
      (err) => {
        console.warn('Error subscribing to cloud logs:', err);
      }
    );

    return this.logsUnsubscribe;
  }

  public async saveActivityLog(userId: string, log: ActivityLogItem): Promise<void> {
    if (this.isDevUser(userId)) return;
    try {
      const logRef = doc(db, 'users', userId, 'activity_logs', log.id);
      await setDoc(logRef, {
        ...log,
        createdAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.error('Error saving log to cloud:', e);
    }
  }

  public cleanup() {
    if (this.txUnsubscribe) this.txUnsubscribe();
    if (this.logsUnsubscribe) this.logsUnsubscribe();
    if (this.userDocUnsubscribe) this.userDocUnsubscribe();
  }
}

export const cloudDb = new CloudDatabaseService();
