import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  RefreshCcw,
  Globe,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  loginWithEmail, 
  registerWithEmail, 
  resetPassword,
  signInWithGoogle 
} from '../lib/firebase';
import { cn } from '../lib/utils';

type AuthMode = 'login' | 'register' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setSuccessMessage(null);
    setIsLoading(false);
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    resetState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!password) {
          // Magic Link flow
          await loginWithEmail(email, '');
          setSuccessMessage("Lien magique envoyé ! Vérifiez votre boîte mail.");
        } else {
          const user = await loginWithEmail(email, password);
          onSuccess?.(user);
          onClose();
        }
      } else if (mode === 'register') {
        if (!name) throw new Error("Veuillez entrer votre nom complet.");
        const user = await registerWithEmail(email, password, name);
        setSuccessMessage("Compte créé ! Un email de confirmation a peut-être été envoyé.");
        if (user) {
          onSuccess?.(user);
          onClose();
        }
      } else if (mode === 'forgot-password') {
        await resetPassword(email);
        setSuccessMessage("Un email de réinitialisation a été envoyé à " + email);
        setMode('login');
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = err.message || "Une erreur est survenue. Veuillez réessayer.";
      if (err.message?.includes('Email not confirmed')) msg = "Veuillez confirmer votre e-mail avant de vous connecter.";
      if (err.message?.includes('Invalid login credentials')) msg = "Email ou mot de passe incorrect.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    resetState();
    setIsLoading(true);
    try {
      const user = await signInWithGoogle();
      onSuccess?.(user);
      onClose();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Erreur avec la connexion Google. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden relative"
      >
        {/* Header Decor */}
        <div className="h-32 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 pointer-events-none">
             {[...Array(20)].map((_, i) => <Globe key={i} size={48} className="translate-x-2 translate-y-2 rotate-12" />)}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/10 p-4 rounded-full backdrop-blur-md">
              <User size={48} className="text-white" />
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              {mode === 'login' && "Bon retour !"}
              {mode === 'register' && "Rejoignez-nous"}
              {mode === 'forgot-password' && "Mot de passe oublié"}
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1">
              {mode === 'login' && "Connectez-vous pour ne rien manquer de l'actualité."}
              {mode === 'register' && "Créez votre compte Akwaba Info en quelques secondes."}
              {mode === 'forgot-password' && "Entrez votre email pour recevoir les instructions."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-red-700 text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
              <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <p className="text-emerald-700 text-xs font-bold leading-tight">{successMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Nom Complet</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                    placeholder="Willy Dumbo"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                  placeholder="contact@akwaba-info.com"
                />
              </div>
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                  {mode === 'login' && (
                    <button 
                      type="button"
                      onClick={() => handleModeChange('forgot-password')}
                      className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      Oublié ?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl text-sm font-bold transition-all outline-none"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <RefreshCcw className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'login' && <><LogIn size={20} /> Se connecter</>}
                  {mode === 'register' && <><UserPlus size={20} /> Créer un compte</>}
                  {mode === 'forgot-password' && <><Send size={20} /> Envoyer</>}
                </>
              )}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 italic" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-slate-400 font-bold uppercase tracking-widest">Ou continuer avec</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full py-4 bg-white border-2 border-slate-100 hover:border-slate-200 rounded-2xl font-bold text-sm tracking-tight transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Compte Google
          </button>

          <div className="mt-8 text-center">
            {mode === 'login' ? (
              <p className="text-sm font-medium text-slate-500">
                Pas encore de compte ?{" "}
                <button onClick={() => handleModeChange('register')} className="text-primary font-black hover:underline">
                  Inscrivez-vous
                </button>
              </p>
            ) : (
              <p className="text-sm font-medium text-slate-500">
                Déjà un compte ?{" "}
                <button onClick={() => handleModeChange('login')} className="text-primary font-black hover:underline">
                  Connectez-vous
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
