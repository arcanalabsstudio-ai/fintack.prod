import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TaxSettings, PlanType, ActivityLogItem } from './types';
import { INITIAL_TRANSACTIONS, DEFAULT_TAX_SETTINGS, DEFAULT_BUDGET_SETTINGS, DEFAULT_SAVINGS_GOAL } from './data/mockData';
import { Plus, Bot } from 'lucide-react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { ReceiptScannerView } from './components/ReceiptScannerView';
import { TaxEstimationView } from './components/TaxEstimationView';
import { TechnicalDeliverableVIew } from './components/TechnicalDeliverableVIew';
import { QuickAddModal } from './components/QuickAddModal';
import { SettingsModal } from './components/SettingsModal';
import { CloudAccountModal } from './components/CloudAccountModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingTour } from './components/OnboardingTour';
import { TermsAgreementScreen } from './components/TermsAgreementScreen';
import { LoginScreen } from './components/LoginScreen';
import { cloudDb, SyncStatus } from './services/cloudDatabase';
import { User } from './lib/firebase';
import { generateUniqueId, sanitizeUniqueIds } from './utils/idGenerator';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);

  // Firebase User & Sync Status
  const [user, setUser] = useState<User | null>(() => {
    try {
      if (localStorage.getItem('fintack_dev_bypass') === 'true') {
        return {
          uid: 'dev-mode-user',
          email: 'dev@fintack.local',
          displayName: 'Desarrollador (Modo Dev)',
          isAnonymous: false,
        } as User;
      }
    } catch (e) {}
    return null;
  });
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const isInitialSyncRef = useRef<boolean>(false);

  // Terms Acceptance State
  const [isTermsAccepted, setIsTermsAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fintack_terms_accepted') === 'true';
    } catch (e) {
      return false;
    }
  });

  // App loading states for technological Splash Screen
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSplashFadingOut, setIsSplashFadingOut] = useState<boolean>(false);

  // Trigger Onboarding tour on first app visit (after Terms are accepted)
  useEffect(() => {
    if (!isLoading && isTermsAccepted) {
      const hasCompleted = localStorage.getItem('fintack_onboarding_completed');
      if (!hasCompleted) {
        const timer = setTimeout(() => {
          setIsOnboardingOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoading, isTermsAccepted]);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem('fintack_activity_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading activity logs:', e);
    }
    return [
      {
        id: 'log-1',
        type: 'RECEIPT_SCANNED',
        description: 'Recibo de Adobe Creative Cloud procesado con IA',
        timestamp: 'Hace 15 minutos',
      },
      {
        id: 'log-2',
        type: 'TRANSACTION_ADDED',
        description: 'Transacción registrada: Desarrollo Web ($2,500.00)',
        timestamp: 'Hace 1 hora',
      },
      {
        id: 'log-3',
        type: 'REGIME_CHANGED',
        description: 'Régimen fiscal guardado en Configuración',
        timestamp: 'Hace 2 horas',
      },
    ];
  });

  // Timer logic for professional technological Splash Screen with exactly 3.5s active loading
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsSplashFadingOut(true);
    }, 3500);

    const doneTimer = setTimeout(() => {
      setIsLoading(false);
    }, 4000); // 3.5s loading + 0.5s fade duration

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  // Load state from localStorage or initial defaults, sanitizing to guarantee collision-free unique IDs
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('fintack_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeUniqueIds(parsed, 'tx');
          // If duplicate IDs were repaired, overwrite localStorage cleanly
          if (JSON.stringify(sanitized) !== saved) {
            try {
              localStorage.setItem('fintack_transactions', JSON.stringify(sanitized));
            } catch (e) {
              console.error('Error saving sanitized transactions to localStorage:', e);
            }
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Error loading transactions:', e);
    }
    return sanitizeUniqueIds(INITIAL_TRANSACTIONS, 'tx');
  });

  const [taxSettings, setTaxSettings] = useState<TaxSettings>(() => {
    try {
      const savedPlan = localStorage.getItem('fintack_plan');
      let defaultPlan: PlanType = 'PRO';
      if (savedPlan === 'LITE' || savedPlan === 'STANDARD' || savedPlan === 'PRO') {
        defaultPlan = savedPlan;
      }
      const saved = localStorage.getItem('fintack_tax_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_TAX_SETTINGS,
          ...parsed,
          vatRate: typeof parsed?.vatRate === 'number' ? parsed.vatRate : DEFAULT_TAX_SETTINGS.vatRate,
          incomeTaxRate: typeof parsed?.incomeTaxRate === 'number' ? parsed.incomeTaxRate : DEFAULT_TAX_SETTINGS.incomeTaxRate,
          estimatedMonthlyIncomeGoal:
            typeof parsed?.estimatedMonthlyIncomeGoal === 'number'
              ? parsed.estimatedMonthlyIncomeGoal
              : DEFAULT_TAX_SETTINGS.estimatedMonthlyIncomeGoal,
          currency: parsed?.currency || DEFAULT_TAX_SETTINGS.currency || 'USD',
          language: parsed?.language || DEFAULT_TAX_SETTINGS.language || 'es',
          username: parsed?.username || '',
          plan: parsed?.plan === 'LITE' || parsed?.plan === 'STANDARD' || parsed?.plan === 'PRO' ? parsed.plan : defaultPlan,
          budgetSettings: parsed?.budgetSettings
            ? {
                ...DEFAULT_BUDGET_SETTINGS,
                ...parsed.budgetSettings,
                categoryLimits: {
                  ...DEFAULT_BUDGET_SETTINGS.categoryLimits,
                  ...(parsed.budgetSettings.categoryLimits || {}),
                },
              }
            : DEFAULT_BUDGET_SETTINGS,
          categories: parsed?.categories
            ? {
                expense: parsed.categories.expense || DEFAULT_TAX_SETTINGS.categories?.expense,
                income: parsed.categories.income || DEFAULT_TAX_SETTINGS.categories?.income,
              }
            : DEFAULT_TAX_SETTINGS.categories,
          savingsGoal: parsed?.savingsGoal
            ? {
                ...DEFAULT_SAVINGS_GOAL,
                ...parsed.savingsGoal,
              }
            : DEFAULT_SAVINGS_GOAL,
        };
      }
      return {
        ...DEFAULT_TAX_SETTINGS,
        plan: defaultPlan,
      };
    } catch (e) {
      console.error('Error loading tax settings:', e);
    }
    return DEFAULT_TAX_SETTINGS;
  });

  const [plan, setPlan] = useState<PlanType>(() => {
    try {
      const saved = localStorage.getItem('fintack_plan');
      if (saved === 'LITE' || saved === 'STANDARD' || saved === 'PRO') return saved as PlanType;
      if (saved === 'PREMIUM') return 'PRO';
      if (saved === 'FREE') return 'STANDARD';
      const savedSettings = localStorage.getItem('fintack_tax_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed?.plan === 'LITE' || parsed?.plan === 'STANDARD' || parsed?.plan === 'PRO') {
          return parsed.plan;
        }
        if (parsed?.plan === 'PREMIUM') return 'PRO';
        if (parsed?.plan === 'FREE') return 'STANDARD';
      }
    } catch (e) {
      console.error('Error loading plan:', e);
    }
    return 'PRO';
  });

  // --- FIREBASE CLOUD INITIALIZATION & REAL-TIME SYNC ---
  useEffect(() => {
    let authUnsubscribe: (() => void) | null = null;
    let txsUnsubscribe: (() => void) | null = null;
    let userUnsubscribe: (() => void) | null = null;
    let logsUnsubscribe: (() => void) | null = null;

    cloudDb.initAuth(
      (currentUser) => {
        if (localStorage.getItem('fintack_dev_bypass') === 'true') {
          setIsAuthReady(true);
          setSyncStatus('synced');
          return;
        }
        setUser(currentUser);
        setIsAuthReady(true);
        if (currentUser) {
          setSyncStatus('synced');

          // 1. Subscribe to User Profile in Firestore
          userUnsubscribe = cloudDb.subscribeToUserProfile(currentUser.uid, (cloudData) => {
            if (cloudData) {
              if (cloudData.taxSettings) {
                setTaxSettings((prev) => ({
                  ...prev,
                  ...cloudData.taxSettings,
                }));
              }
              if (cloudData.plan) {
                setPlan(cloudData.plan);
              }
              if (cloudData.termsAccepted !== undefined) {
                setIsTermsAccepted(cloudData.termsAccepted);
              }
            } else {
              // Create user document if it does not exist yet
              cloudDb.saveUserProfile(currentUser.uid, {
                username: taxSettings.username || (currentUser.email ? currentUser.email.split('@')[0] : 'Freelancer'),
                plan,
                taxSettings,
                termsAccepted: isTermsAccepted,
                email: currentUser.email,
              });
            }
          });

          // 2. Subscribe to Transactions in Firestore
          txsUnsubscribe = cloudDb.subscribeToTransactions(
            currentUser.uid,
            (remoteTxs) => {
              if (remoteTxs.length > 0) {
                setTransactions(sanitizeUniqueIds(remoteTxs, 'tx'));
              }
              setSyncStatus('synced');
            },
            () => {
              // Remote collection is empty: Seed initial transactions to Firestore
              if (!isInitialSyncRef.current) {
                isInitialSyncRef.current = true;
                cloudDb.seedInitialTransactions(currentUser.uid, transactions);
              }
            }
          );

          // 3. Subscribe to Activity Logs
          logsUnsubscribe = cloudDb.subscribeToActivityLogs(currentUser.uid, (remoteLogs) => {
            if (remoteLogs.length > 0) {
              setActivityLogs(remoteLogs);
            }
          });
        } else {
          setSyncStatus('offline');
          if (txsUnsubscribe) {
            txsUnsubscribe();
            txsUnsubscribe = null;
          }
          if (userUnsubscribe) {
            userUnsubscribe();
            userUnsubscribe = null;
          }
          if (logsUnsubscribe) {
            logsUnsubscribe();
            logsUnsubscribe = null;
          }
        }
      },
      (status) => setSyncStatus(status)
    ).then((unsub) => {
      authUnsubscribe = unsub;
    });

    return () => {
      if (authUnsubscribe) authUnsubscribe();
      if (txsUnsubscribe) txsUnsubscribe();
      if (userUnsubscribe) userUnsubscribe();
      if (logsUnsubscribe) logsUnsubscribe();
    };
  }, []);

  // Redirect to available tabs if user switches to LITE (Impuestos y Centro de Control se ocultan)
  useEffect(() => {
    if (plan === 'LITE' && (currentTab === 'tax' || currentTab === 'deliverables')) {
      setCurrentTab('dashboard');
    }
  }, [plan, currentTab]);

  // Keep plan state and taxSettings.plan in absolute sync
  useEffect(() => {
    if (taxSettings.plan && taxSettings.plan !== plan) {
      setPlan(taxSettings.plan);
    }
  }, [taxSettings.plan]);

  useEffect(() => {
    if (taxSettings.plan !== plan) {
      setTaxSettings((prev) => ({ ...prev, plan }));
    }
  }, [plan, taxSettings.plan]);

  // Persist to localStorage as local cache
  useEffect(() => {
    try {
      localStorage.setItem('fintack_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('fintack_tax_settings', JSON.stringify(taxSettings));
    } catch (e) {
      console.error('Error saving tax settings:', e);
    }
  }, [taxSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('fintack_plan', plan);
    } catch (e) {
      console.error('Error saving plan:', e);
    }
  }, [plan]);

  useEffect(() => {
    try {
      localStorage.setItem('fintack_activity_logs', JSON.stringify(activityLogs));
    } catch (e) {
      console.error('Error saving activity logs:', e);
    }
  }, [activityLogs]);

  // Helper to add log and persist to Cloud
  const addActivityLog = (type: ActivityLogItem['type'], description: string) => {
    const newLog: ActivityLogItem = {
      id: generateUniqueId('log'),
      type,
      description,
      timestamp: 'Hace un momento',
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 15)]);

    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      cloudDb.saveActivityLog(currentUser.uid, newLog);
    }
  };

  // Transaction Handlers with robust unique ID generation and Cloud Firestore synchronization
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => {
    let createdItem: Transaction | null = null;

    setTransactions((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      let finalId = newTx.id;
      if (!finalId || existingIds.has(finalId)) {
        finalId = generateUniqueId('tx');
      }

      const created: Transaction = {
        ...newTx,
        id: finalId,
        createdAt: new Date().toISOString(),
      };
      createdItem = created;

      return [created, ...prev.filter((t) => t.id !== created.id)];
    });

    // Save to Firestore
    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser && createdItem) {
      setSyncStatus('saving');
      try {
        await cloudDb.saveTransaction(currentUser.uid, createdItem);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Error syncing new transaction to Firestore:', e);
        setSyncStatus('synced');
      }
    }

    // Register log
    if (newTx.hasReceipt) {
      addActivityLog('RECEIPT_SCANNED', `Recibo de ${newTx.merchant || newTx.description || 'proveedor'} procesado e ingresado con IA`);
    } else {
      addActivityLog('TRANSACTION_ADDED', `Nueva transacción: ${newTx.description || newTx.merchant || 'Movimiento'} ($${newTx.amount})`);
    }
  };

  const handleBatchAddTransactions = async (newTxs: (Omit<Transaction, 'id' | 'createdAt'> & { id?: string })[]) => {
    if (!newTxs || newTxs.length === 0) return;

    let createdList: Transaction[] = [];

    setTransactions((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      createdList = newTxs.map((item) => {
        let finalId = item.id;
        if (!finalId || existingIds.has(finalId)) {
          finalId = generateUniqueId('tx');
        }
        existingIds.add(finalId);
        return {
          ...item,
          id: finalId,
          createdAt: new Date().toISOString(),
        };
      });

      return [...createdList, ...prev];
    });

    // Save batch to Firestore if user is authenticated
    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser && createdList.length > 0) {
      setSyncStatus('saving');
      Promise.all(createdList.map((tx) => cloudDb.saveTransaction(currentUser.uid, tx)))
        .then(() => setSyncStatus('synced'))
        .catch((e) => {
          console.error('Error batch syncing transactions to Firestore:', e);
          setSyncStatus('synced');
        });
    }

    addActivityLog('TRANSACTION_ADDED', `Se importaron ${newTxs.length} movimientos bancarios`);
  };

  const handleUpdateTaxSettings = (newSettings: TaxSettings | ((prev: TaxSettings) => TaxSettings)) => {
    setTaxSettings((prev) => {
      const updated = typeof newSettings === 'function' ? newSettings(prev) : newSettings;
      if (updated.regime !== prev.regime) {
        addActivityLog('REGIME_CHANGED', `Régimen fiscal cambiado a: "${updated.regime}"`);
      }

      // Persist to Cloud User Profile
      const currentUser = user || cloudDb.getCurrentUser();
      if (currentUser) {
        setSyncStatus('saving');
        cloudDb.saveUserProfile(currentUser.uid, {
          taxSettings: updated,
          plan: updated.plan || plan,
          username: updated.username,
        }).then(() => setSyncStatus('synced'));
      }

      return updated;
    });
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
    addActivityLog('TRANSACTION_ADDED', `Transacción actualizada: ${updatedTx.merchant || updatedTx.description} ($${updatedTx.amount})`);

    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      setSyncStatus('saving');
      try {
        await cloudDb.saveTransaction(currentUser.uid, updatedTx);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Error syncing updated transaction to Firestore:', e);
        setSyncStatus('synced');
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      setSyncStatus('saving');
      try {
        await cloudDb.deleteTransaction(currentUser.uid, id);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Error deleting transaction from Firestore:', e);
        setSyncStatus('synced');
      }
    }
  };

  const handleReassignCategory = (oldCategoryName: string, newCategoryName: string) => {
    const updated = transactions.map((tx) =>
      tx.category === oldCategoryName ? { ...tx, category: newCategoryName } : tx
    );
    setTransactions(updated);

    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      updated.forEach((tx) => {
        if (tx.category === newCategoryName) {
          cloudDb.saveTransaction(currentUser.uid, tx);
        }
      });
    }
  };

  const handleResetData = () => {
    const cleanDefaults = sanitizeUniqueIds(INITIAL_TRANSACTIONS, 'tx');
    setTransactions(cleanDefaults);
    setTaxSettings(DEFAULT_TAX_SETTINGS);
    try {
      localStorage.removeItem('fintack_transactions');
      localStorage.removeItem('fintack_tax_settings');
      localStorage.removeItem('fintack_terms_accepted');
      localStorage.removeItem('fintack_terms_accepted_date');
      localStorage.removeItem('fintack_onboarding_completed');
      localStorage.setItem('fintack_transactions', JSON.stringify(cleanDefaults));
    } catch (e) {
      console.error('Error clearing localStorage on reset:', e);
    }
    setIsTermsAccepted(false);

    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      cloudDb.seedInitialTransactions(currentUser.uid, INITIAL_TRANSACTIONS);
      cloudDb.saveUserProfile(currentUser.uid, {
        taxSettings: DEFAULT_TAX_SETTINGS,
        plan: 'PRO',
        termsAccepted: false,
      });
    }
  };

  const handleForceSync = () => {
    const currentUser = user || cloudDb.getCurrentUser();
    if (currentUser) {
      setSyncStatus('saving');
      cloudDb.seedInitialTransactions(currentUser.uid, transactions).then(() => {
        cloudDb.saveUserProfile(currentUser.uid, {
          taxSettings,
          plan,
          termsAccepted: isTermsAccepted,
        }).then(() => {
          setSyncStatus('synced');
        });
      });
    }
  };

  const handleDevBypass = () => {
    try {
      localStorage.setItem('fintack_dev_bypass', 'true');
      localStorage.setItem('fintack_terms_accepted', 'true');
    } catch (e) {}
    setIsTermsAccepted(true);
    const mockDevUser = {
      uid: 'dev-mode-user',
      email: 'dev@fintack.local',
      displayName: 'Desarrollador (Modo Dev)',
      isAnonymous: false,
    } as User;
    setUser(mockDevUser);
    setSyncStatus('synced');
  };

  const handleSignOut = async () => {
    try {
      try {
        localStorage.removeItem('fintack_dev_bypass');
      } catch (e) {}
      await cloudDb.signOut();
      setUser(null);
      setIsSettingsOpen(false);
      setIsCloudModalOpen(false);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  return (
    <>
      {isLoading && <SplashScreen isFadingOut={isSplashFadingOut} />}

      {/* RUTA PROTEGIDA: Si no ha iniciado sesión, mostrar LoginScreen */}
      {!isLoading && isAuthReady && (!user || user.isAnonymous) && (
        <LoginScreen
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
          }}
          onDevBypass={handleDevBypass}
        />
      )}

      {/* Términos y Condiciones tras inicio de sesión */}
      {!isLoading && isAuthReady && user && !user.isAnonymous && !isTermsAccepted && (
        <TermsAgreementScreen
          onAccept={() => {
            setIsTermsAccepted(true);
            const currentUser = user || cloudDb.getCurrentUser();
            if (currentUser) {
              cloudDb.saveUserProfile(currentUser.uid, { termsAccepted: true });
            }
          }}
          onReturnToLogin={handleSignOut}
        />
      )}

      {/* APLICACIÓN PRINCIPAL (SOLO ACCESIBLE CON SESIÓN INICIADA) */}
      {(!isLoading || isSplashFadingOut) && isAuthReady && user && !user.isAnonymous && isTermsAccepted && (
        <div className="min-h-screen bg-gradient-to-b from-[#081512] via-[#050B09] to-[#020504] text-[#E5E7EB] font-sans antialiased selection:bg-[#14B8A6] selection:text-[#020504] overflow-x-hidden relative">
          {/* Ambient background glow */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#14B8A6]/3 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#14B8A6]/2 rounded-full blur-3xl pointer-events-none" />

          {/* HEADER & NAV */}
          <Header
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            plan={plan}
            setPlan={setPlan}
            taxSettings={taxSettings}
            onOpenSettings={() => setIsSettingsOpen(true)}
            syncStatus={syncStatus}
            user={user}
            onOpenCloudModal={() => setIsCloudModalOpen(true)}
            onReturnToLogin={handleSignOut}
          />

          {/* MAIN VIEW CONTENT */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            {currentTab === 'dashboard' && (
              <DashboardView
                transactions={transactions}
                taxSettings={taxSettings}
                plan={plan}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onUpgradePlan={() => setPlan('PRO')}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                taxSettings={taxSettings}
                onDeleteTransaction={handleDeleteTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                onAddTransaction={handleAddTransaction}
                onBatchAddTransactions={handleBatchAddTransactions}
                onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                plan={plan}
                onUpgradePlan={() => setPlan('PRO')}
              />
            )}

            {currentTab === 'scanner' && (
              <ReceiptScannerView
                plan={plan}
                taxSettings={taxSettings}
                onAddTransaction={handleAddTransaction}
                onBatchAddTransactions={handleBatchAddTransactions}
                onUpgradePlan={() => setPlan('PRO')}
              />
            )}

            {currentTab === 'tax' && (
              <TaxEstimationView
                transactions={transactions}
                taxSettings={taxSettings}
                onUpdateTaxSettings={handleUpdateTaxSettings}
                plan={plan}
                onUpgradePlan={() => setPlan('PRO')}
              />
            )}

            {currentTab === 'deliverables' && (
              <TechnicalDeliverableVIew
                transactions={transactions}
                taxSettings={taxSettings}
                activityLogs={activityLogs}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </main>

          {/* MODALS */}
          <QuickAddModal
            isOpen={isQuickAddOpen}
            onClose={() => setIsQuickAddOpen(false)}
            taxSettings={taxSettings}
            onAddTransaction={handleAddTransaction}
            onOpenScanner={() => setCurrentTab('scanner')}
          />

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            taxSettings={taxSettings}
            onSaveTaxSettings={handleUpdateTaxSettings}
            plan={plan}
            setPlan={setPlan}
            onResetData={handleResetData}
            transactions={transactions}
            onReassignCategory={handleReassignCategory}
            onReplayOnboarding={() => setIsOnboardingOpen(true)}
            onOpenCloudModal={() => setIsCloudModalOpen(true)}
            syncStatus={syncStatus}
            onSignOut={handleSignOut}
            user={user}
          />

          <CloudAccountModal
            isOpen={isCloudModalOpen}
            onClose={() => setIsCloudModalOpen(false)}
            user={user}
            syncStatus={syncStatus}
            transactionsCount={transactions.length}
            taxSettings={taxSettings}
            plan={plan}
            onForceSync={handleForceSync}
          />

          {/* ASISTENTE DE AYUDA IA FIN */}
          <AIAssistantModal
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            currentTab={currentTab}
            plan={plan}
            taxSettings={taxSettings}
            onUpgradePlan={() => setPlan('PRO')}
            onNavigateTab={(tab) => {
              setCurrentTab(tab);
              setIsAssistantOpen(false);
            }}
          />

          {/* BOTÓN FLOTANTE ASISTENTE IA (🤖 Fin) - A LA IZQUIERDA */}
          <button
            id="fab-ai-assistant"
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-tr from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-[#020504] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(20,184,166,0.35)] hover:shadow-[0_12px_28px_rgba(20,184,166,0.48)] transition-all duration-200 active:scale-95 z-40 cursor-pointer group"
            title="Asistente de Ayuda IA (Fin)"
            aria-label="Asistente de Ayuda IA Fin"
          >
            <Bot className="w-7 h-7 text-[#020504] transition-transform duration-200 group-hover:scale-110" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#14B8A6] border-2 border-[#081512]"></span>
            </span>
          </button>

          {/* BOTÓN FLOTANTE (+ AGREGAR GASTO/INGRESO) - A LA DERECHA */}
          <button
            id="fab-quick-add"
            onClick={() => setIsQuickAddOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(20,184,166,0.35)] hover:shadow-[0_12px_28px_rgba(20,184,166,0.48)] transition-all duration-200 active:scale-95 z-40 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/60 cursor-pointer group"
            title="Agregar Transacción (+)"
            aria-label="Agregar Transacción"
          >
            <Plus className="w-7 h-7 text-[#020504] transition-transform duration-200 group-hover:scale-110" strokeWidth={2.5} />
          </button>

          {/* INTERACTIVE ONBOARDING TOUR */}
          <OnboardingTour
            isOpen={isOnboardingOpen}
            onComplete={() => setIsOnboardingOpen(false)}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        </div>
      )}
    </>
  );
}

