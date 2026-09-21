import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  Sparkles,
  Code2,
  ArrowRight
} from 'lucide-react';
import { cloudDb } from '../services/cloudDatabase';
import { User } from '../lib/firebase';

interface LoginScreenProps {
  onLoginSuccess?: (user: User) => void;
  onDevBypass?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onDevBypass }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getFirebaseErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Credenciales inválidas. Verifica tu correo electrónico y contraseña.';
      case 'auth/email-already-in-use':
        return 'Este correo ya se encuentra registrado. Por favor selecciona "Iniciar Sesión".';
      case 'auth/weak-password':
        return 'La contraseña debe tener un mínimo de 6 caracteres.';
      case 'auth/invalid-email':
        return 'El formato de correo electrónico no es válido.';
      case 'auth/popup-closed-by-user':
        return 'Inicio de sesión con Google cancelado por el usuario.';
      case 'auth/popup-blocked':
        return 'La ventana emergente fue bloqueada por tu navegador. Permite ventanas emergentes para continuar.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet e inténtalo de nuevo.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Por seguridad, espera unos minutos antes de volver a intentar.';
      default:
        return error?.message || 'Ocurrió un error en la autenticación. Por favor intenta de nuevo.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        setErrorMessage('Por favor confirma tu contraseña.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Las contraseñas no coinciden. Verifica que ambas sean iguales.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let loggedUser: User;
      if (mode === 'login') {
        loggedUser = await cloudDb.signInWithEmail(cleanEmail, password);
        setSuccessMessage('¡Bienvenido de vuelta! Accediendo a Fintack...');
      } else {
        loggedUser = await cloudDb.signUpWithEmail(cleanEmail, password);
        setSuccessMessage('¡Cuenta creada con éxito! Configurando tu espacio contable...');
      }

      setTimeout(() => {
        onLoginSuccess?.(loggedUser);
      }, 400);
    } catch (err: any) {
      console.error('Email authentication error:', err);
      setErrorMessage(getFirebaseErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const loggedUser = await cloudDb.signInWithGoogle();
      setSuccessMessage('¡Autenticado con Google! Accediendo...');
      setTimeout(() => {
        onLoginSuccess?.(loggedUser);
      }, 400);
    } catch (err: any) {
      console.error('Google authentication error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMessage(getFirebaseErrorMessage(err));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDevAccess = () => {
    try {
      localStorage.setItem('fintack_terms_accepted', 'true');
      localStorage.setItem('fintack_dev_bypass', 'true');
    } catch (e) {
      console.warn('Could not store dev bypass in localStorage:', e);
    }

    if (onDevBypass) {
      onDevBypass();
    } else if (onLoginSuccess) {
      const mockDevUser = {
        uid: 'dev-mode-user',
        email: 'dev@fintack.local',
        displayName: 'Desarrollador (Modo Dev)',
        isAnonymous: false,
      } as User;
      onLoginSuccess(mockDevUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#081512] via-[#050B09] to-[#020504] text-[#E5E7EB] font-sans antialiased flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#14B8A6] selection:text-[#020504] relative overflow-hidden">
      {/* Luces de ambiente en verde esmeralda */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#14B8A6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#0F766E]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-20 right-1/3 w-80 h-80 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Contenedor principal de Autenticación */}
      <div className="w-full max-w-md bg-[#0B1512]/90 backdrop-blur-xl border border-[#182F2A] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* LOGO & BRAND */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-[58px] h-[58px] mt-1.5 mb-2.5 flex items-center justify-center relative">
            <svg
              className="w-full h-full filter drop-shadow-[0_4px_14px_rgba(0,245,182,0.22)]"
              viewBox="31 41 120.5 105"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="loginScreenGrad1"
                  x1="72.167"
                  y1="116.299"
                  x2="148.16"
                  y2="53"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#008c68" />
                  <stop offset="100%" stopColor="#00f5b6" />
                </linearGradient>
                <radialGradient
                  id="loginScreenGrad2"
                  cx="122.85"
                  cy="115.35"
                  r="7.05"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </radialGradient>
              </defs>
              <path
                fill="url(#loginScreenGrad1)"
                stroke="#004d38"
                strokeWidth="1.6"
                d="M 91.499998,44.1 34.026839,143.64643 H 148.5 l -9.57642,-16.58684 H 102 L 120.61881,94.81086 110.59998,77.457743 82.015863,126.96689 H 63.3 l 38.1328,-66.047952 z"
              />
              <circle
                fill="url(#loginScreenGrad2)"
                stroke="#004d38"
                strokeWidth="0.8"
                cx="122.85"
                cy="115.35"
                r="7.05"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-black uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#14B8A6] via-[#99F6E4] to-white leading-tight">
            FINTACK
          </h1>
          <p className="text-[10px] font-light uppercase tracking-[0.25em] text-[#7C9791] mt-2">
            Smart Tax Ledger
          </p>
        </div>

        {/* SELECTOR DE MODOS: INICIAR SESIÓN / REGISTRARSE */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#06100E] rounded-2xl border border-[#182F2A] mb-6">
          <button
            type="button"
            id="tab-login-mode"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'login'
                ? 'bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] shadow-xs'
                : 'text-[#7C9791] hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            id="tab-register-mode"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-[#11241F] text-[#14B8A6] border border-[#1C3A31] shadow-xs'
                : 'text-[#7C9791] hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Registrarse</span>
          </button>
        </div>

        {/* ALERTA DE ERROR */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ALERTA DE ÉXITO */}
        {successMessage && (
          <div className="mb-4 p-3 bg-[#14B8A6]/15 border border-[#14B8A6]/40 rounded-xl flex items-center gap-2.5 text-xs text-[#14B8A6] font-semibold animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 text-[#14B8A6] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* BOTÓN: INICIAR SESIÓN CON GOOGLE */}
        <button
          type="button"
          id="btn-google-auth"
          onClick={handleGoogleAuth}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-2.5 px-4 bg-[#081512] hover:bg-[#11241F] border border-[#1C3A31] hover:border-[#14B8A6]/40 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isGoogleLoading ? (
            <RefreshCw className="w-4 h-4 text-[#14B8A6] animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Iniciar sesión con Google</span>
        </button>

        {/* SEPARADOR */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#182F2A]" />
          </div>
          <span className="relative px-3 bg-[#0B1512] text-[11px] font-medium text-[#7C9791] uppercase tracking-wider">
            {mode === 'login' ? 'O usa tu correo' : 'O regístrate con correo'}
          </span>
        </div>

        {/* FORMULARIO DE CORREO Y CONTRASEÑA */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-semibold text-[#C5D7D3] mb-1.5" htmlFor="auth-email">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7C9791] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="ejemplo@freelance.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-[#06100E] border border-[#182F2A] rounded-xl text-xs text-white placeholder-[#4E6661] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#C5D7D3]" htmlFor="auth-password">
                Contraseña
              </label>
              {mode === 'register' && (
                <span className="text-[10px] text-[#7C9791]">Mínimo 6 caracteres</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7C9791] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[#06100E] border border-[#182F2A] rounded-xl text-xs text-white placeholder-[#4E6661] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C9791] hover:text-white p-1 transition cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirmar Contraseña (Solo en Modo Registrarse) */}
          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="block text-xs font-semibold text-[#C5D7D3] mb-1.5" htmlFor="auth-confirm-password">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7C9791] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#06100E] border border-[#182F2A] rounded-xl text-xs text-white placeholder-[#4E6661] focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7C9791] hover:text-white p-1 transition cursor-pointer"
                  title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* BOTÓN SUBMIT */}
          <button
            type="submit"
            id="btn-auth-submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3 px-4 bg-[#14B8A6] hover:bg-[#0D9488] text-[#020504] font-bold text-xs rounded-xl shadow-[0_4px_16px_rgba(20,184,166,0.25)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.35)] transition duration-200 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#020504]" />
                <span>{mode === 'login' ? 'Iniciando sesión...' : 'Creando tu cuenta...'}</span>
              </>
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4 text-[#020504]" />
                <span>Iniciar Sesión</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 text-[#020504]" />
                <span>Crear Cuenta en Fintack</span>
              </>
            )}
          </button>
        </form>

        {/* PIE DEL CARD: TOGGLE DE MODOS */}
        <div className="mt-5 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-[#7C9791]">
              ¿Aún no tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                className="text-[#14B8A6] hover:underline font-semibold cursor-pointer"
              >
                Regístrate gratis
              </button>
            </p>
          ) : (
            <p className="text-xs text-[#7C9791]">
              ¿Ya tienes una cuenta registrada?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-[#14B8A6] hover:underline font-semibold cursor-pointer"
              >
                Inicia sesión aquí
              </button>
            </p>
          )}
        </div>

        {/* ACCESO PARA DESARROLLO (TEMPORAL) */}
        <div className="mt-5 pt-4 border-t border-[#182F2A]/60">
          <button
            type="button"
            id="btn-dev-bypass"
            onClick={handleDevAccess}
            className="w-full py-2.5 px-3 bg-[#0A1A16] hover:bg-[#0F241F] text-amber-300 hover:text-amber-200 border border-amber-500/35 hover:border-amber-400/60 rounded-xl text-xs font-semibold flex items-center justify-between transition duration-200 active:scale-[0.99] cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.06)] group"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Entrar al Dashboard</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
              Modo Dev
              <ArrowRight className="w-3 h-3 text-amber-400" />
            </span>
          </button>
          <p className="text-[10px] text-[#657F79] text-center mt-1.5">
            Temporal: omite el registro para continuar el desarrollo del dashboard
          </p>
        </div>

        {/* BADGES DE SEGURIDAD Y PRIVACIDAD */}
        <div className="mt-6 pt-4 border-t border-[#182F2A]/70 flex items-center justify-center gap-4 text-[11px] text-[#7C9791]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
            Firestore Cloud Cifrado
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#14B8A6]" />
            Sesión Persistente
          </span>
        </div>
      </div>
    </div>
  );
};
