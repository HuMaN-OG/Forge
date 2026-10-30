import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080C14] text-slate-100 antialiased font-sans">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0B0F19] to-[#070A11] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
