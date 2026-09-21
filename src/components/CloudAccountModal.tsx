import React, { useState } from 'react';
import { 
  X, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Mail, 
  User as UserIcon, 
  LogOut, 
  RefreshCw, 
  ShieldCheck,
  Zap,
  LogIn,
  UserPlus
} from 'lucide-react';
import { User, auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, fbSignOut, signInAnonymously, updateProfile } from '../lib/firebase';
import { SyncStatus, cloudDb } from '../services/cloudDatabase';
import { TaxSettings, Transaction, PlanType } from '../types';

interface CloudAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  syncStatus: SyncStatus;
  transactionsCount: number;
  taxSettings: TaxSettings;
  plan: PlanType;
  onForceSync?: () => void;
}

export const CloudAccountModal: React.FC<CloudAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  syncStatus,
  transactionsCount,
  taxSettings,
  plan,
  onForceSync,
}) => {
  const [mode, setMode] = useState<'info' | 'login' | 'register'>('info');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAnonymous = user?.isAnonymous ?? true;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg('¡Sesión iniciada con éxito! Tus datos en la nube han sido sincronizados.');
      setTimeout(() => {
        setMode('info');
      }, 1500);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Credenciales incorrectas. Verifica tu correo y contraseña.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del correo electrónico no es válido.');
      } else {
        setError(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && userCred.user) {
        await updateProfile(userCred.user, { displayName });
      }
      // Save user profile immediately to Cloud
      await cloudDb.saveUserProfile(userCred.user.uid, {
        username: displayName || email.split('@')[0],
        email: userCred.user.email,
        plan,
        taxSettings,
        termsAccepted: true,
      });

      setSuccessMsg('¡Cuenta en la nube creada exitosamente! Tus datos están protegidos en Firestore.');
      setTimeout(() => {
        setMode('info');
      }, 1500);
    } catch (err: any) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Inicia sesión en su lugar.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(err.message || 'Error al crear la cuenta.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await fbSignOut(auth);
      // Automatically re-authenticate anonymously for continuous cloud persistence
      await signInAnonymously(auth);
      setSuccessMsg('Sesión cerrada. Iniciada sesión local protegida en la nube.');
      setMode('info');
    } catch (err: any) {
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSyncBadge = () => {
    switch (syncStatus) {
      case 'synced':
        return {
          text: 'Base de Datos Conectada y Sincronizada',
          color: 'text-[#14B8A6] bg-[#11241F] border-[#14B8A6]/30',
          dot: 'bg-[#14B8A6]',
        };
      case 'saving':
        return {
          text: 'Guardando en la Nube...',
          color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
          dot: 'bg-amber-400 animate-ping',
        };
      case 'connecting':
        return {
          text: 'Conectando con Firestore...',
          color: 'text-sky-400 bg-sky-950/40 border-sky-500/30',
          dot: 'bg-sky-400 animate-pulse',
        };
      default:
        return {
          text: 'Modo sin conexión',
          color: 'text-[#7C9791] bg-[#182F2A] border-[#1C3A31]',
          dot: 'bg-zinc-500',
        };
    }
  };

  const syncBadge = getSyncBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B1512] border border-[#182F2A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative text-white">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#182F2A] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#11241F] rounded-xl border border-[#14B8A6]/30 text-[#14B8A6] shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Base de Datos en la Nube</h3>
              <p className="text-xs text-[#7C9791]">Firebase Firestore & Autenticación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7C9791] hover:text-white rounded-lg hover:bg-[#11241F] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${syncBadge.color}`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${syncBadge.dot}`} />
            <span>{syncBadge.text}</span>
          </div>
          <span className="text-[10px] font-mono opacity-80">{transactionsCount} txs</span>
        </div>

        {/* Mode Switcher if in info mode */}
        {mode === 'info' && (
          <div className="space-y-4">
            {/* Account Card */}
            <div className="bg-[#060D0B] p-4 rounded-xl border border-[#182F2A] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#11241F] border border-[#1C3A31] flex items-center justify-center text-[#14B8A6] font-bold text-xs">
                    {user?.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {user?.displayName || (isAnonymous ? 'Usuario en la Nube (Sesión Protegida)' : user?.email)}
                    </h4>
                    <p className="text-[11px] font-mono text-[#7C9791]">
                      {user?.email || `ID: ${user?.uid.slice(0, 16)}...`}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#11241F] text-[#14B8A6] border border-[#14B8A6]/30 uppercase font-semibold">
                  {plan}
                </span>
              </div>

              <div className="text-xs text-[#7C9791] pt-2 border-t border-[#182F2A]/60 flex items-center justify-between">
                <span>Colección Firestore:</span>
                <span className="font-mono text-white text-[11px]">users/{user?.uid.slice(0, 8)}...</span>
              </div>
            </div>

            {/* Cloud Features Benefits */}
            <div className="space-y-2 text-xs text-[#7C9791]">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                <span>Tus transacciones y presupuestos se respaldan en tiempo real en Firestore.</span>
              </div>
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                <span>Acceso multi-dispositivo y sincronización automática.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {isAnonymous ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMode('login');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#11241F] hover:bg-[#182F2A] border border-[#1C3A31] text-white font-semibold text-xs rounded-xl transition"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#14B8A6]" />
                    <span>Iniciar Sesión</span>
                  </button>
                  <button
                    onClick={() => {
                      setMode('register');
                      setError(null);
                      setSuccessMsg(null);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#14B8A6] hover:bg-[#00D29C] text-[#020504] font-bold text-xs rounded-xl transition shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Crear Cuenta</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {onForceSync && (
                    <button
                      onClick={onForceSync}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#11241F] hover:bg-[#182F2A] border border-[#1C3A31] text-white font-semibold text-xs rounded-xl transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#14B8A6]" />
                      <span>Forzar Sincronización</span>
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-semibold text-xs rounded-xl transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-[#11241F] border border-[#14B8A6]/40 text-[#14B8A6] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7C9791]">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7C9791] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#060D0B] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#182F2A] text-xs font-medium focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7C9791]">Contraseña</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C9791] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#060D0B] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#182F2A] text-xs font-medium focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('info')}
                className="flex-1 py-2.5 px-3 bg-[#11241F] hover:bg-[#182F2A] border border-[#1C3A31] text-white text-xs font-semibold rounded-xl transition"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-3 bg-[#14B8A6] hover:bg-[#00D29C] text-[#020504] font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-[#14B8A6] hover:underline"
              >
                ¿No tienes cuenta? Crear una gratis
              </button>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/50 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-[#11241F] border border-[#14B8A6]/40 text-[#14B8A6] text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7C9791]">Nombre o Negocio</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#7C9791] absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu Nombre o Freelance Studio"
                  className="w-full bg-[#060D0B] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#182F2A] text-xs font-medium focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7C9791]">Correo Electrónico</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7C9791] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-[#060D0B] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#182F2A] text-xs font-medium focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#7C9791]">Contraseña (mínimo 6 caracteres)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C9791] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#060D0B] text-white pl-9 pr-3 py-2.5 rounded-xl border border-[#182F2A] text-xs font-medium focus:outline-none focus:border-[#14B8A6]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMode('info')}
                className="flex-1 py-2.5 px-3 bg-[#11241F] hover:bg-[#182F2A] border border-[#1C3A31] text-white text-xs font-semibold rounded-xl transition"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-3 bg-[#14B8A6] hover:bg-[#00D29C] text-[#020504] font-bold text-xs rounded-xl transition shadow-md disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Registrar Cuenta'}
              </button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-[#14B8A6] hover:underline"
              >
                ¿Ya tienes cuenta? Inicia sesión
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
