'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, MapPin, PlusCircle, UserCircle, Menu, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

export function Navigation() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Painel', href: '/', icon: LayoutDashboard },
    { name: 'Maquinário', href: '/frota', icon: Truck },
    { name: 'Setores', href: '/setores', icon: MapPin },
    { name: 'Materiais', href: '/materiais', icon: Box },
    { name: 'Nova Escavação', href: '/nova-viagem', icon: PlusCircle },
  ];

  return (
    <>
      <header className="bg-white border-b border-outline-variant fixed top-0 w-full z-50 h-14 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Menu className="text-black" />
          <h1 className="font-semibold text-black uppercase tracking-tight text-sm">CONTROLE DE ESCAVAÇÃO</h1>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium hidden sm:inline">{user.user_metadata?.full_name || user.email}</span>
              <div className="w-8 h-8 rounded-full bg-[#eceef0] flex items-center justify-center overflow-hidden border border-[#c6c6cd]">
                {user.user_metadata?.avatar_url ? (
                  <Image src={user.user_metadata.avatar_url} alt="User" width={32} height={32} referrerPolicy="no-referrer" />
                ) : (
                  <UserCircle className="text-[#45464d]" />
                )}
              </div>
              <button 
                onClick={logout}
                className="text-[10px] font-bold uppercase tracking-widest text-[#93000a] hover:underline"
              >
                Sair
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <nav className="fixed bottom-0 w-full bg-white border-t border-outline-variant z-50 h-16 flex items-center justify-around px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[64px] transition-all",
                isActive ? "text-[#131b2e]" : "text-[#7c839b] hover:text-black"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive && "bg-secondary-container"
              )}>
                <Icon size={isActive ? 22 : 20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-tighter",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
