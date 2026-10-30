import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '../common/Button';
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
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-[#6EA8FF] stroke-[1.75]" />
          <h3 className="font-semibold text-[#F1F3F5] text-xs">Backend API & Database Integration</h3>
        </div>
        <span className="text-[10px] font-mono text-[#687180]">Node.js Express / SQLite</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-[#929AA8] mb-1">
            Backend Target URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:5000"
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-[#F1F3F5] font-mono focus:outline-none focus:border-[#77D9E8]/40"
            />
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              loading={testing}
              onClick={handleTest}
            >
              Test Health
            </Button>
          </div>
          <p className="text-[10px] text-[#687180] mt-1">
            Environment variable: <code className="text-[#77D9E8] font-mono">VITE_API_BASE_URL</code>
          </p>
        </div>

        {/* Live Test Feedback */}
        {testResult && (
          <div className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
            testResult.connected
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}>
            {testResult.connected ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="font-medium block">{testResult.message}</span>
              {!testResult.connected && (
                <p className="text-[10px] text-[#929AA8] mt-0.5">
                  Server at <code className="text-[#77D9E8] font-mono">{apiUrl}/api/health</code> is not responding. FORGE automatically runs in decoupled standalone simulation mode.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Contract Map */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1.5 text-[11px]">
          <span className="font-medium text-[#F1F3F5] block">Target Backend Endpoints (Bhuvan):</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px] text-[#929AA8]">
            <div><span className="text-emerald-400">GET</span> /api/health</div>
            <div><span className="text-emerald-400">GET</span> /api/system/status</div>
            <div><span className="text-[#6EA8FF]">POST</span> /api/tasks</div>
            <div><span className="text-emerald-400">GET</span> /api/tasks</div>
            <div><span className="text-[#6EA8FF]">POST</span> /api/tasks/:id/approve</div>
            <div><span className="text-emerald-400">GET</span> /api/files</div>
            <div><span className="text-rose-400">DEL</span> /api/memory/:id</div>
            <div><span className="text-emerald-400">GET</span> /api/memory</div>
          </div>
        </div>
      </div>
    </div>
  );
}
