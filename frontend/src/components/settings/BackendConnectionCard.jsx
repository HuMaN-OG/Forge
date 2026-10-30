import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useSystem } from '../../context/SystemContext';

export function BackendConnectionCard() {
  const { backendStatus, testConnection } = useSystem();
  const [apiUrl, setApiUrl] = useState(backendStatus.baseUrl || 'http://localhost:5000');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(apiUrl);
      setTestResult(res);
    } catch (err) {
      setTestResult({
        connected: false,
        status: 'error',
        message: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Backend Integration (Node.js & Express)
            </h3>
            <p className="text-xs text-slate-400">
              Owned and managed by Bhuvan &bull; Handles persistent SQLite storage and tool execution
            </p>
          </div>
        </div>

        <Badge
          variant={backendStatus.status === 'connected' ? 'emerald' : 'cyan'}
        >
          {backendStatus.status === 'connected' ? 'Live Connected' : 'Simulated Dev Mode'}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Backend API Base URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={testing}
              onClick={handleTest}
              className="text-xs"
            >
              Test Health
            </Button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Configured via <code className="text-cyan-300">VITE_API_BASE_URL</code> in <code className="text-slate-300">frontend/.env</code>.
          </p>
        </div>

        {/* Live Test Feedback */}
        {testResult && (
          <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
            testResult.connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {testResult.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <span className="font-semibold block">{testResult.message}</span>
              {!testResult.connected && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Expected endpoint <code className="text-cyan-400">{apiUrl}/api/health</code> is not responding yet. The frontend automatically runs using realistic simulated mock responses.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Endpoints Contract Guide for Bhuvan */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
          <span className="font-semibold text-slate-300 block">Proposed API Endpoints to Align with Bhuvan:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-slate-400">
            <div><span className="text-emerald-400">GET</span> /api/health</div>
            <div><span className="text-emerald-400">GET</span> /api/system/status</div>
            <div><span className="text-blue-400">POST</span> /api/tasks</div>
            <div><span className="text-emerald-400">GET</span> /api/tasks</div>
            <div><span className="text-blue-400">POST</span> /api/tasks/:id/approve</div>
            <div><span className="text-emerald-400">GET</span> /api/files</div>
            <div><span className="text-rose-400">DEL</span> /api/memory/:id</div>
            <div><span className="text-emerald-400">GET</span> /api/memory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
