import { useEffect, useState } from 'react';
import { Target, Users } from 'lucide-react';
import { addAndNotify, removeAndNotify, updateAndNotify } from '@/lib/db';
import { swalConfirm, swalSuccess } from '@/lib/sweetalert';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import type { Client, Opportunity, OpportunityActivity, OpportunityStage } from '@/types';
import { ClientsTable } from '@/components/clients/ClientsTable';
import { ClientSidebar, type ClientForm } from '@/components/clients/ClientSidebar';
import { ClientViewSidebar } from '@/components/clients/ClientViewSidebar';
import { OpportunitiesTable } from '@/components/clients/OpportunitiesTable';
import { OpportunitySidebar, type OpportunityForm } from '@/components/clients/OpportunitySidebar';
import { OpportunityViewSidebar } from '@/components/clients/OpportunityViewSidebar';
import { useCollection } from '@/components/clients/shared';

type Tab = 'clients' | 'opportunities';

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'opportunities', label: 'Opportunités', icon: Target },
];

export function ClientsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { user } = useAuth();
  const userId = user?.uid || 'user-1';
  const userName = user?.displayName || 'Utilisateur';

  const clients = useCollection('clients') as Client[];
  const opportunities = useCollection('opportunities') as Opportunity[];

  const [tab, setTab] = useState<Tab>('clients');

  // Client sidebars
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClientId, setViewingClientId] = useState<string | null>(null);

  // Opportunity sidebars
  const [oppFormOpen, setOppFormOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [viewingOppId, setViewingOppId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPageTitle('Gestion Commerciale');
  }, [setCurrentPageTitle]);

  const viewingClient = clients.find((c) => c.id === viewingClientId) ?? null;
  const viewingOpp = opportunities.find((o) => o.id === viewingOppId) ?? null;

  // ---- Clients ----
  const saveClient = (form: ClientForm) => {
    const payload = {
      ...form,
      name: form.name.trim(),
      city: form.city.trim() || 'Douala',
      contactName: form.contactName.trim() || form.name.trim(),
      contactEmail: form.contactEmail.trim() || form.email.trim(),
    };
    if (editingClient) {
      updateAndNotify('clients', editingClient.id, payload);
      showToast('Client mis à jour', 'success');
    } else {
      addAndNotify('clients', {
        id: `client-${Date.now()}`,
        country: 'Cameroun',
        totalInvoiced: 0,
        totalPaid: 0,
        outstandingBalance: 0,
        createdAt: new Date().toISOString(),
        companyId: 'comp-1',
        ...payload,
      } as Client);
      showToast('Client créé avec succès', 'success');
    }
    setClientFormOpen(false);
  };

  const deleteClient = async (client: Client) => {
    if (!(await swalConfirm('Supprimer ce client ?', `« ${client.name} » sera définitivement supprimé.`))) return;
    removeAndNotify('clients', client.id);
    if (viewingClientId === client.id) setViewingClientId(null);
    void swalSuccess('Client supprimé');
  };

  // ---- Opportunities ----
  const saveOpportunity = (form: OpportunityForm) => {
    const now = new Date().toISOString();
    const fields = {
      title: form.title.trim(),
      clientId: form.clientId || editingOpp?.clientId || `client-${Date.now()}`,
      clientName: form.clientName.trim(),
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      value: Number(form.value),
      probability: Math.min(100, Math.max(0, Number(form.probability) || 0)),
      stage: form.stage,
      expectedCloseDate: form.expectedCloseDate,
      source: form.source.trim(),
      notes: form.notes,
      updatedAt: now,
    };
    if (editingOpp) {
      updateAndNotify('opportunities', editingOpp.id, fields);
      showToast('Opportunité mise à jour', 'success');
    } else {
      addAndNotify('opportunities', {
        id: `opp-${Date.now()}`,
        assignedTo: userId,
        assignedToName: userName,
        products: [],
        activities: [],
        createdAt: now,
        companyId: 'comp-1',
        ...fields,
      } as Opportunity);
      showToast('Opportunité créée', 'success');
    }
    setOppFormOpen(false);
  };

  const deleteOpportunity = async (opp: Opportunity) => {
    if (!(await swalConfirm('Supprimer cette opportunité ?', `« ${opp.title} » sera définitivement supprimée.`))) return;
    removeAndNotify('opportunities', opp.id);
    if (viewingOppId === opp.id) setViewingOppId(null);
    void swalSuccess('Opportunité supprimée');
  };

  const changeStage = (opp: Opportunity, stage: OpportunityStage) => {
    updateAndNotify('opportunities', opp.id, { stage, updatedAt: new Date().toISOString() });
    showToast('Étape mise à jour', 'success');
  };

  const addActivity = (opp: Opportunity, type: OpportunityActivity['type'], description: string) => {
    const activity: OpportunityActivity = {
      id: `oa-${Date.now()}`,
      type,
      description,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString(),
    };
    updateAndNotify('opportunities', opp.id, {
      activities: [...(opp.activities ?? []), activity],
      updatedAt: new Date().toISOString(),
    });
    showToast('Activité ajoutée', 'success');
  };

  const counts: Record<Tab, number> = { clients: clients.length, opportunities: opportunities.length };

  return (
    <div className="-m-6 flex h-[calc(100vh-76px)] min-h-0 flex-col bg-[var(--bg-card)]">
      {/* Tabs */}
      <div role="tablist" aria-label="Gestion commerciale" className="flex shrink-0 items-end gap-1 border-b border-[var(--divider)] px-5">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-selected={active}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={`-mb-px flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                active
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon size={16} />
              {label}
              <span
                className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                  active ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'bg-[var(--bg-card-hover)] text-[var(--text-muted)]'
                }`}
              >
                {counts[id]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div
        role="tabpanel"
        id="panel-clients"
        aria-labelledby="tab-clients"
        hidden={tab !== 'clients'}
        className="min-h-0 flex-1"
      >
        {tab === 'clients' && (
          <ClientsTable
            items={clients}
            onAdd={() => {
              setEditingClient(null);
              setClientFormOpen(true);
            }}
            onView={(client) => setViewingClientId(client.id)}
            onEdit={(client) => {
              setEditingClient(client);
              setClientFormOpen(true);
            }}
            onDelete={deleteClient}
          />
        )}
      </div>
      <div
        role="tabpanel"
        id="panel-opportunities"
        aria-labelledby="tab-opportunities"
        hidden={tab !== 'opportunities'}
        className="min-h-0 flex-1"
      >
        {tab === 'opportunities' && (
          <OpportunitiesTable
            items={opportunities}
            onAdd={() => {
              setEditingOpp(null);
              setOppFormOpen(true);
            }}
            onView={(opp) => setViewingOppId(opp.id)}
            onEdit={(opp) => {
              setEditingOpp(opp);
              setOppFormOpen(true);
            }}
            onDelete={deleteOpportunity}
          />
        )}
      </div>

      <ClientSidebar open={clientFormOpen} item={editingClient} onClose={() => setClientFormOpen(false)} onSave={saveClient} />
      <ClientViewSidebar
        item={viewingClient}
        onClose={() => setViewingClientId(null)}
        onEdit={(client) => {
          setViewingClientId(null);
          setEditingClient(client);
          setClientFormOpen(true);
        }}
      />
      <OpportunitySidebar open={oppFormOpen} item={editingOpp} clients={clients} onClose={() => setOppFormOpen(false)} onSave={saveOpportunity} />
      <OpportunityViewSidebar
        item={viewingOpp}
        onClose={() => setViewingOppId(null)}
        onEdit={(opp) => {
          setViewingOppId(null);
          setEditingOpp(opp);
          setOppFormOpen(true);
        }}
        onStageChange={changeStage}
        onAddActivity={addActivity}
      />
    </div>
  );
}
