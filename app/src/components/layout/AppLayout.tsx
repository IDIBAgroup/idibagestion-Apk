import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastProvider } from '@/components/shared/ToastProvider';
import { SearchModal } from '@/components/shared/SearchModal';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { useEffect } from 'react';

export function AppLayout() {
  const { sidebarOpen } = useUIStore();
  const { primaryColor } = useBrandingStore();

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-primary', primaryColor);
  }, [primaryColor]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <Header />
      <ToastProvider />
      <SearchModal />

      <motion.main
        initial={false}
        animate={{
          marginLeft: sidebarOpen ? 240 : 72,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="pt-[var(--header-height)] min-h-screen"
      >
        <div className="p-6">
          <Outlet />
        </div>
      </motion.main>
    </div>
  );
}
