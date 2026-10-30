import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0B0E] text-[#EDEDED] antialiased select-none">
      {/* Sleek Minimalist Sidebar */}
      <Sidebar />

      {/* Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0A0B0E] bg-ambient-glow relative">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
