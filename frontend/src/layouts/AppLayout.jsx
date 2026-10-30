import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090B10] text-[#F1F3F5] antialiased">
      {/* Precision Left Sidebar */}
      <Sidebar />

      {/* Main Surface */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#090B10]">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
