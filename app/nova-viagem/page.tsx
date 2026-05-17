'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { useRouter } from 'next/navigation';
import { Truck, MapPin, Save, Clock, Square, Gauge, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function NovaViagemPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [points, setPoints] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchData = async () => {
      const [v, m, p] = await Promise.all([
        supabase.from('frota').select('*').order('prefix', { ascending: true }),
        supabase.from('materiais').select('*').order('name', { ascending: true }),
        supabase.from('setores').select('*').order('name', { ascending: true }),
      ]);
      
      if (v.data) setVehicles(v.data);
      if (m.data) setMaterials(m.data);
      if (p.data) setPoints(p.data);
    };

    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const vId = formData.get('vehicleId');
      const vehicle = vehicles.find(v => v.prefix === vId);
      
      const { error } = await supabase.from('viagens').insert({
        vehicle_id: vId,
        material_id: formData.get('materialId'),
        origin_id: formData.get('originId'),
        destination_id: formData.get('destinationId'),
        km_initial: Number(formData.get('kmInitial')),
        km_final: Number(formData.get('kmFinal')),
        volume: vehicle?.capacity || 0,
        user_id: user?.id,
        user_name: user?.user_metadata?.full_name || user?.email
      });

      if (error) throw error;
      
      toast.success('Viagem registrada!');
      router.push('/');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar.');
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="pb-32 pt-20 bg-surface min-h-screen">
      <Navigation />
      <main className="max-w-xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8">Registro de Viagem</h2>
        <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-xl p-4 space-y-6 shadow-sm">
          <select name="vehicleId" required className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm">
            <option value="">Selecione o equipamento...</option>
            {vehicles.map(v => (<option key={v.id} value={v.prefix}>{v.prefix}</option>))}
          </select>
          <select name="materialId" required className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm">
            <option value="">Selecione o material...</option>
            {materials.map(m => (<option key={m.id} value={m.name}>{m.name}</option>))}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <select name="originId" required className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm">
              <option value="">Origem...</option>
              {points.filter(p => p.type !== 'Descarga').map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
            <select name="destinationId" required className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm">
              <option value="">Destino...</option>
              {points.filter(p => p.type !== 'Carga').map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="kmInitial" type="number" step="0.001" placeholder="KM Inicial" className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm" />
            <input name="kmFinal" type="number" step="0.001" placeholder="KM Final" className="w-full bg-surface border border-outline rounded-lg h-12 px-4 shadow-sm" />
          </div>
          <button disabled={isSubmitting} className="w-full bg-black text-white h-14 rounded-xl font-bold uppercase shadow-lg">Salvar Viagem</button>
        </form>
      </main>
    </div>
  );
}
