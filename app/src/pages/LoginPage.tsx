import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [email, setEmail] = useState('pdg@idibagroup.cm');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Email ou mot de passe incorrect.');
    }
  };

  const features = [
    'Conformité CEMAC (SYSCOHADA & CNPS)',
    'Mode hors-ligne avec synchronisation',
    'Multi-entreprises et branding personnalisé',
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] grid-pattern flex">
      {/* Left - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            {/* Logo */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                <span className="text-white font-bold text-xl">I</span>
              </div>
            </div>
            <h1 className="text-center text-xl font-bold text-[var(--text-primary)] mb-1">IDIBAGES</h1>
            <p className="text-center text-sm text-[var(--text-secondary)] mb-8">
              Système d&apos;Exploitation d&apos;Entreprise — Zone CEMAC
            </p>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/20 text-sm text-[var(--accent-danger)]"
              >
                {error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 glass-input text-sm"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 pl-10 pr-10 glass-input text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--glass-border)] bg-[var(--bg-elevated)] checked:bg-[var(--accent-primary)]"
                  />
                  <span className="text-[var(--text-secondary)]">Se souvenir de moi</span>
                </label>
                <button type="button" className="text-[var(--accent-primary)] hover:underline text-sm">
                  Mot de passe oublié ?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 btn-primary justify-center text-base disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full"
                  />
                ) : (
                  'Se Connecter'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[var(--divider)]" />
              <span className="text-xs text-[var(--text-muted)]">ou</span>
              <div className="flex-1 h-px bg-[var(--divider)]" />
            </div>

            {/* Demo credentials */}
            <div className="p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
              <p className="text-xs text-[var(--text-muted)] mb-2">Comptes de démonstration :</p>
              {['pdg@idibagroup.cm', 'compta@idibagroup.cm', 'cto@idibagroup.cm'].map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => setEmail(email)}
                  className="block text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors py-0.5"
                >
                  {email}
                </button>
              ))}
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Mot de passe : password</p>
            </div>

            <p className="text-center text-[11px] text-[var(--text-muted)] mt-6">
              © 2024 IDIBAGES. Conformité SYSCOHADA & CNPS.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right - Illustration (desktop only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 via-transparent to-[var(--accent-secondary)]/5" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 text-center px-12"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src="/login-illustration.jpg"
              alt="Dashboard"
              className="w-80 h-80 object-contain mx-auto mb-8 rounded-2xl opacity-90"
            />
          </motion.div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
            La gestion d&apos;entreprise, simplifiée.
          </h2>
          <div className="space-y-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="flex items-center gap-2 justify-center text-sm text-[var(--text-secondary)]"
              >
                <Check size={16} className="text-[var(--accent-primary)]" />
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
