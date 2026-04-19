import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useAuth } from './auth';
import type { MessageTemplate } from './types';

type Row = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  tone: MessageTemplate['tone'];
  target_role: string;
  industry: string;
  open_rate: number | null;
  response_rate: number | null;
  created_at: string;
};

const rowToTemplate = (r: Row): MessageTemplate => ({
  id: r.id,
  name: r.name,
  subject: r.subject ?? undefined,
  body: r.body,
  tone: r.tone,
  targetRole: r.target_role,
  industry: r.industry,
  openRate: r.open_rate ?? undefined,
  responseRate: r.response_rate ?? undefined,
  createdAt: r.created_at,
});

type NewTemplate = Omit<MessageTemplate, 'id' | 'createdAt'>;

const migrationFlagKey = (userId: string) => `leadhawk-migrated-templates-${userId}`;

async function importFromLocalStorage(userId: string) {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(migrationFlagKey(userId))) return;

  const raw = localStorage.getItem('leadhawk-storage');
  if (!raw) {
    localStorage.setItem(migrationFlagKey(userId), '1');
    return;
  }

  let legacy: MessageTemplate[] = [];
  try {
    const parsed = JSON.parse(raw);
    legacy = parsed?.state?.templates ?? [];
  } catch {
    localStorage.setItem(migrationFlagKey(userId), '1');
    return;
  }

  if (legacy.length === 0) {
    localStorage.setItem(migrationFlagKey(userId), '1');
    return;
  }

  const rows = legacy.map((t) => ({
    user_id: userId,
    name: t.name,
    subject: t.subject ?? null,
    body: t.body,
    tone: t.tone,
    target_role: t.targetRole ?? '',
    industry: t.industry ?? '',
    open_rate: t.openRate ?? null,
    response_rate: t.responseRate ?? null,
  }));

  const { error } = await supabase.from('message_templates').insert(rows);
  if (!error) localStorage.setItem(migrationFlagKey(userId), '1');
}

export function useTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setTemplates([]);
    } else {
      setTemplates((data as Row[]).map(rowToTemplate));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await importFromLocalStorage(user.id);
      await load();
    })();
  }, [user, load]);

  const addTemplate = useCallback(
    async (t: NewTemplate) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          user_id: user.id,
          name: t.name,
          subject: t.subject ?? null,
          body: t.body,
          tone: t.tone,
          target_role: t.targetRole,
          industry: t.industry,
          open_rate: t.openRate ?? null,
          response_rate: t.responseRate ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      const saved = rowToTemplate(data as Row);
      setTemplates((prev) => [saved, ...prev]);
      return saved;
    },
    [user]
  );

  const deleteTemplate = useCallback(async (id: string) => {
    const { error } = await supabase.from('message_templates').delete().eq('id', id);
    if (error) throw error;
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { templates, loading, addTemplate, deleteTemplate, reload: load };
}
