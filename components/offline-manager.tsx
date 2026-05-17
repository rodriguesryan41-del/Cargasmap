'use client';

import { useEffect, useState } from 'react';
import { syncOfflineData } from '@/lib/offline-sync';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function OfflineManager() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    setIsOnline(navigator.onLine);
    if (navigator.onLine) {
      syncOfflineData();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-[#93000a] text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg text-xs font-bold uppercase tracking-wider"
        >
          <WifiOff size={16} />
          Modo Offline Ativo
        </motion.div>
      )}
    </AnimatePresence>
  );
}
