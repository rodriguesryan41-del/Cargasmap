'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { motion } from 'motion/react';
import { Box, Plus, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function MateriaisPage() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchMaterials = async () => {
      const { data, error } = await supabase
        .from('materiais')
        .select('*')
        .order('name', { ascending: true });
      if (!error) setMaterials(data || []);
    };

    fetchMaterials();

    const channel = supabase
      .channel('materiais_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materiais' }, () => {
        fetchMaterials();
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
      const { error } = await supabase.from('materiais').insert({
        name: formData.get('name'),
        density: Number(formData.get('density')),
        code: formData.get('code')
      });
      
      if (error) throw error;
      
      toast.success('Material cadastrado!');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao cadastrar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-32 pt-20 bg-surface min-h-screen">
      <Navigation />
      <main className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">Tipos de Materiais</h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <section className="md:col-span-12 lg:col-span-5 bg-white border border-outline-variant rounded-xl p-4 shadow-sm h-fit">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" required className="w-full h-11 px-4 border border-outline rounded-lg" placeholder="Nome do Material" />
              <input name="density" type="number" step="0.01" required className="w-full h-11 px-4 border border-outline rounded-lg" placeholder="Densidade (t/m³)" />
              <input name="code" required className="w-full h-11 px-4 border border-outline rounded-lg uppercase" placeholder="Código (ex: MAT-01)" />
              <button disabled={isSubmitting} className="w-full h-12 bg-black text-white font-bold rounded-lg uppercase text-[10px] tracking-widest shadow-md">Cadastrar</button>
            </form>
          </section>
          <section className="md:col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-outline-variant">
              {materials.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center"><Box size={24} /></div>
                    <div><h3 className="font-bold text-sm text-black">{m.name}</h3><p className="text-[10px] font-bold text-on-surface-variant uppercase">{m.density} t/m³ • {m.code}</p></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
