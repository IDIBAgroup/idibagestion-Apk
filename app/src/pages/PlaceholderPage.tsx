import { useEffect } from 'react';
import { Construction } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';

interface PlaceholderPageProps {
  title: string;
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  const { setCurrentPageTitle } = useUIStore();
  useEffect(() => { setCurrentPageTitle(title); }, [title, setCurrentPageTitle]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="text-center">
        <div className="p-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-primary)]/10 flex items-center justify-center mx-auto mb-4">
            <Construction size={32} className="text-[var(--accent-primary)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-sm">
            Ce module est en cours de développement. Les fonctionnalités seront disponibles prochainement.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
