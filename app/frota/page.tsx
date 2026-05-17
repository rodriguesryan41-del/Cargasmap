'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { motion } from 'motion/react';
import { Truck, Plus, MoreVertical, Settings, Construction, Box, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function FrotaPage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('frota')
        .select('*')
        .order('prefix', { ascending: true });
      if (!error) setVehicles(data || []);
    };

    fetchVehicles();

    const channel = supabase
      .channel('frota_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'frota' }, () => {
        fetchVehicles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.from('frota').insert({
        prefix: formData.get('prefix'),
        type: formData.get('type'),
        capacity: Number(formData.get('capacity')),
        status: 'Disponível',
        updated_by: user?.id,
        last_update: new Date().toISOString()
      });
      
      if (error) throw error;
      
      toast.success('Equipamento registrado!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao registrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 pt-20 bg-surface min-h-screen">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4 space-y-8">
        <section>
          <h2 className="text-2xl font-bold text-black tracking-tight">Gestão de Maquinário</h2>
        </section>
        <section className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="prefix" required className="w-full h-11 px-4 border border-outline rounded-lg bg-surface font-mono" placeholder="Prefixo (ex: ESC-001)" />
              <select name="type" required className="w-full h-11 px-4 border border-outline rounded-lg bg-surface">
                <option value="Basculante">Basculante</option>
                <option value="Escavadeira">Escavadeira</option>
              </select>
              <input name="capacity" type="number" step="0.01" required className="w-full h-11 px-4 border border-outline rounded-lg bg-surface font-mono md:col-span-2" placeholder="Capacidade (m³)" />
            </div>
            <button disabled={isSubmitting} className="bg-black text-white px-8 h-12 rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-md">Registrar</button>
          </form>
        </section>
        <section className="grid grid-cols-1 gap-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white border border-outline-variant rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center"><Truck size={24} /></div>
                <div><p className="font-mono font-bold text-black">{v.prefix}</p><p className="text-[10px] font-bold text-on-surface-variant uppercase">{v.capacity} m³ • {v.type}</p></div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
