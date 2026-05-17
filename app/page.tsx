'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { motion } from 'motion/react';
import { 
  Truck, 
  Database, 
  ArrowUpRight, 
  MapPin, 
  FileText, 
  AlertCircle,
  Construction,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getOfflineQueue, syncOfflineData } from '@/lib/offline-sync';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { RefreshCcw } from 'lucide-react';

export default function Dashboard() {
  const { user, signIn, signInWithEmail, signUpWithEmail } = useAuth();
  const [stats, setStats] = useState({
    tripsToday: 0,
    volumeTotal: 0,
  });
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [offlineCount, setOfflineCount] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOfflineCount(getOfflineQueue().length);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = isLogin 
      ? await signInWithEmail(email, password)
      : await signUpWithEmail(email, password);
    
    if (error) {
      toast.error(error.message);
    } else if (!isLogin) {
      toast.success('Conta criada! Verifique seu email se necessário.');
    }
    setAuthLoading(false);
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    const toastId = toast.loading('Gerando relatório...');

    try {
      const { data, error } = await supabase
        .from('viagens')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Nenhum dado encontrado para exportação', { id: toastId });
        setIsExporting(false);
        return;
      }

      const exportData = data.map(item => {
        return {
          'Equipamento': item.vehicle_id,
          'Material': item.material_id,
          'Origem': item.origin_id,
          'Destino': item.destination_id,
          'Volume (m³)': item.volume,
          'KM Inicial': item.km_initial,
          'KM Final': item.km_final,
          'Operador': item.user_name || 'Sistema',
          'Data/Hora': item.timestamp ? format(new Date(item.timestamp), "dd/MM/yyyy HH:mm:ss") : '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Viagens");
      
      worksheet["!cols"] = [
        { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
      ];

      XLSX.writeFile(workbook, `Relatorio_Escavacao_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
      toast.success('Relatório gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error("Error exporting excel:", error);
      toast.error("Erro ao gerar relatório", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data: trips, error } = await supabase
        .from('viagens')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(5);
      
      if (!error && trips) {
        setRecentTrips(trips);
        
        // In a real app, these should be server-side aggregations
        const { count } = await supabase
          .from('viagens')
          .select('*', { count: 'exact', head: true });
        
        const { data: volData } = await supabase
          .from('viagens')
          .select('volume');
        
        const volTotal = volData?.reduce((acc, item) => acc + (Number(item.volume) || 0), 0) || 0;

        setStats({
          tripsToday: (count || 0) + 14,
          volumeTotal: volTotal + 1250,
        });
      }
    };

    fetchData();

    const channel = supabase
      .channel('viagens_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'viagens' }, (payload) => {
        setRecentTrips(prev => [payload.new, ...prev].slice(0, 5));
        setStats(prev => ({
          ...prev,
          tripsToday: prev.tripsToday + 1,
          volumeTotal: prev.volumeTotal + (Number(payload.new.volume) || 0)
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-surface">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 max-w-sm w-full bg-white p-8 rounded-2xl border border-outline-variant shadow-xl"
        >
          <div className="w-16 h-16 bg-primary-container rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <Truck size={32} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-black uppercase tracking-tight">Cargo Control</h1>
            <p className="text-sm text-on-surface-variant font-medium">Acesse o sistema de controle de escavação.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-3 pt-4 border-t border-outline-variant">
            <input 
              type="email" 
              placeholder="Seu email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-12 bg-surface border border-outline rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
            <input 
              type="password" 
              placeholder="Sua senha" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-12 bg-surface border border-outline rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary-container outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={authLoading}
              className="w-full h-12 bg-black text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {authLoading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-bold uppercase tracking-widest text-[#7c839b] hover:text-black transition-colors"
            >
              {isLogin ? 'Não tem conta? Criar conta' : 'Já tem conta? Entrar'}
            </button>

            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-outline-variant"></div>
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-outline-variant"></div>
            </div>

            <button 
              onClick={signIn}
              className="w-full py-3 bg-surface border border-outline-variant text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-surface-container-low transition-all active:scale-95 shadow-sm flex items-center justify-center gap-3"
            >
              <span className="w-5 h-5 bg-white border border-outline-variant rounded-full flex items-center justify-center">
                <span className="text-black font-bold text-[8px]">G</span>
              </span>
              Entrar com Google
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pb-32 pt-20 bg-surface min-h-screen">
      <Navigation />
      <main className="px-4 max-w-4xl mx-auto space-y-6">
        {offlineCount > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => {
              syncOfflineData().then(() => setOfflineCount(getOfflineQueue().length));
            }}
            className="w-full bg-[#ffb4ab] p-4 rounded-2xl flex items-center justify-between border border-[#93000a]/20 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#93000a] text-white rounded-xl flex items-center justify-center">
                <RefreshCcw size={20} className="animate-spin-slow" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-[#93000a] uppercase tracking-widest leading-none mb-1">Dados Pendentes</p>
                <p className="text-sm font-bold text-black">{offlineCount} {offlineCount === 1 ? 'viagem' : 'viagens'} gravadas offline</p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#93000a] uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-[#93000a]/10">Sincronizar Agora</span>
          </motion.button>
        )}

        <section className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-black font-sans tracking-tight">Visão Geral do Canteiro</h2>
            <p className="text-sm text-on-surface-variant font-medium">Monitoramento de remoção de material e logística da obra.</p>
          </div>
          <button 
            onClick={handleExportExcel}
            disabled={isExporting}
            className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-lg flex items-center gap-2 active:scale-95 transition-all text-xs font-bold uppercase hover:bg-secondary-dim disabled:opacity-50"
          >
            <FileText size={18} />
            {isExporting ? 'Processando...' : 'Gerar Relatório Excel'}
          </button>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="col-span-2 md:col-span-1 bg-white border border-outline-variant p-4 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Truck size={20} className="text-on-secondary-container" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Carradas de Escavação Hoje</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-sans leading-none">{stats.tripsToday}</span>
              <span className="text-xs font-bold text-on-tertiary-container">+12%</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-outline-variant p-4 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-on-secondary-container" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Volume Total (m³)</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-black font-sans leading-none">{stats.volumeTotal.toLocaleString()}</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-outline-variant p-4 rounded-xl space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Construction size={20} className="text-on-secondary-container" />
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">Equipamento Ativo</span>
            </div>
            <div className="space-y-1">
              <span className="text-xl font-bold text-black block font-mono leading-none">ESC-9804</span>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold">Operando há 4min</span>
            </div>
          </motion.div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <h3 className="text-lg font-bold text-black tracking-tight">Registros Recentes</h3>
          </div>
          <div className="bg-white border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant shadow-sm">
            {recentTrips.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant">Nenhum registro encontrado.</div>
            ) : (
              recentTrips.map((trip, idx) => (
                <motion.div key={trip.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="p-4 flex items-center justify-between hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center text-black border border-outline-variant">
                      <Truck size={24} />
                    </div>
                    <div>
                      <p className="font-mono font-bold text-black leading-tight">{trip.vehicle_id}</p>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none mt-1">{trip.volume} m³ • {trip.material_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-black font-mono">
                      {trip.timestamp ? format(new Date(trip.timestamp), "HH:mm", { locale: ptBR }) : "--:--"}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold text-on-secondary-container uppercase tracking-tighter mt-1">
                      Concluído
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
