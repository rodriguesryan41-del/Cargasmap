'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { motion } from 'motion/react';
import { MapPin, Save, Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function SetoresPage() {
  const { user } = useAuth();
  const [points, setPoints] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchPoints = async () => {
      const { data, error } = await supabase
        .from('setores')
        .select('*')
        .order('name', { ascending: true });
      if (!error) setPoints(data || []);
    };

    fetchPoints();

    const channel = supabase
      .channel('setores_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'setores' }, () => {
        fetchPoints();
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
      const { error } = await supabase.from('setores').insert({
        name: formData.get('name'),
        type: formData.get('type'),
        status: 'Ativo'
      });
      
      if (error) throw error;
      
      toast.success('Local salvo!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar local.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 pt-20 bg-surface min-h-screen">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">Setores e Logística</h2>
        <section className="bg-white border border-outline-variant rounded-xl p-6 mb-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input name="name" required className="w-full bg-surface border border-outline rounded-lg px-4 h-11" placeholder="Nome do Local" />
              <select name="type" className="w-full bg-surface border border-outline rounded-lg px-4 h-11">
                <option value="Carga">Local de Carga</option>
                <option value="Descarga">Local de Descarga</option>
              </select>
            </div>
            <button disabled={isSubmitting} className="bg-black text-white px-8 h-12 rounded-lg font-bold uppercase text-[10px] tracking-widest shadow-md">Salvar Local</button>
          </form>
        </section>
        <div className="grid grid-cols-1 gap-4">
          {points.map(point => (
            <div key={point.id} className="bg-white border border-outline-variant rounded-xl p-4 flex items-center gap-4">
              <div className="bg-surface-container-high w-12 h-12 rounded-xl flex items-center justify-center"><MapPin size={24} /></div>
              <div><h4 className="font-bold text-sm text-black">{point.name}</h4><p className="text-[10px] uppercase font-bold">{point.type}</p></div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
