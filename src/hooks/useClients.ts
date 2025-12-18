import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Client {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      // Transformar nombres a mayúsculas al cargar
      const sanitized = (data || []).map(c => ({ ...c, name: c.name.toUpperCase() }));
      setClients(sanitized);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const addClient = async (name: string, phone?: string, email?: string): Promise<Client | null> => {
    try {
      const upperName = name.toUpperCase();
      const { data, error } = await supabase
        .from('clients')
        .insert([{ name: upperName, phone, email }])
        .select()
        .single();

      if (error) throw error;
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Cliente "${upperName}" agregado`);
      return data;
    } catch (error) {
      toast.error('Error al agregar el cliente');
      return null;
    }
  };

  return { clients, loading, addClient, refetch: fetchClients };
};
