import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function ToastProvider() {
  const { toast, clearToast } = useUIStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => clearToast(), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-[#2DD4A8]" />,
    error: <AlertCircle className="w-5 h-5 text-[#EF4444]" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />,
    info: <Info className="w-5 h-5 text-[#3B82F6]" />,
  };

  const borderColors = {
    success: 'border-l-[#2DD4A8]',
    error: 'border-l-[#EF4444]',
    warning: 'border-l-[#F59E0B]',
    info: 'border-l-[#3B82F6]',
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, x: 100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed top-4 right-4 z-[100] glass-card-compact border-l-4 ${borderColors[toast.type]} p-4 flex items-center gap-3 min-w-[320px]`}
        >
          {icons[toast.type]}
          <span className="text-sm text-[var(--text-primary)] flex-1">{toast.message}</span>
          <button
            onClick={clearToast}
            className="p-1 rounded hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
