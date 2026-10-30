import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SystemProvider } from './context/SystemContext';
import { TaskProvider } from './context/TaskContext';
import { AppLayout } from './layouts/AppLayout';
import { WorkspacePage } from './pages/WorkspacePage';
import { HistoryPage } from './pages/HistoryPage';
import { MemoryPage } from './pages/MemoryPage';
import { FilesPage } from './pages/FilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <SystemProvider>
      <TaskProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<WorkspacePage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="memory" element={<MemoryPage />} />
              <Route path="files" element={<FilesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TaskProvider>
    </SystemProvider>
  );
}

export default App;
