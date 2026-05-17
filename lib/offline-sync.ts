import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

const OFFLINE_QUEUE_KEY = 'cargo_control_offline_trips';

export interface OfflineTrip {
  id: string;
  data: any;
  timestamp: string;
}

export const saveTripOffline = (data: any) => {
  const queue: OfflineTrip[] = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  const newTrip: OfflineTrip = {
    id: Math.random().toString(36).substring(7),
    data,
    timestamp: new Date().toISOString(),
  };
  queue.push(newTrip);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return newTrip;
};

export const getOfflineQueue = (): OfflineTrip[] => {
  return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
};

export const clearOfflineTrip = (id: string) => {
  const queue = getOfflineQueue();
  const filtered = queue.filter(t => t.id !== id);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
};

export const syncOfflineData = async () => {
  if (typeof window === 'undefined') return;
  if (!navigator.onLine) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  const toastId = toast.loading(`Sincronizando ${queue.length} viagens pendentes...`);

  let successCount = 0;
  for (const item of queue) {
    try {
      const { error } = await supabase.from('viagens').insert(item.data);
      if (!error) {
        clearOfflineTrip(item.id);
        successCount++;
      }
    } catch (err) {
      console.error('Error syncing trip:', err);
    }
  }

  if (successCount > 0) {
    toast.success(`${successCount} viagens sincronizadas com sucesso!`, { id: toastId });
  } else {
    toast.dismiss(toastId);
  }
};

export const isOnline = () => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};
