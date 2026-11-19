'use client';

import { useState, useEffect } from 'react';

interface DriveInfo {
  DriveLetter: string;
  FileSystemLabel: string;
  SizeGB: string;
  FreeGB: string;
}

interface ProcessInfo {
  Name: string;
  MemoryMB: string;
}

export default function Home() {
  const [drives, setDrives] = useState<DriveInfo[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastCleanResult, setLastCleanResult] = useState<string>('');

  async function fetchSystemData() {
    try {
      const resDrives = await fetch('/api/system?action=drives');
      const dataDrives = await resDrives.json();
      if (dataDrives.drives) setDrives(dataDrives.drives);

      const resProc = await fetch('/api/system?action=processes');
      const dataProc = await resProc.json();
      if (dataProc.processes) setProcesses(dataProc.processes);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchSystemData();
  }, []);

  async function runAction(action: string, label: string) {
    setLoadingAction(label);
    setStatusMessage(`Running ${label}... Please wait.`);
    try {
      const res = await fetch('/api/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage(data.message);
        if (action === 'clean-temp') {
          setLastCleanResult(data.message);
        }
        fetchSystemData();
      } else {
        setStatusMessage('Error: ' + data.error);
      }
    } catch (e) {
      setStatusMessage('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-[#f4f4f5] p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">LOCAL PC TOOL</span>
              <span className="text-xs text-emerald-400 font-medium">● 100% Offline & Secure</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Yoh's PC Optimizer & Health Dashboard</h1>
            <p className="text-sm text-gray-400 mt-1">Clean junk files, flush DNS cache, monitor drives, and keep your Windows PC running lightning fast.</p>
          </div>
          <button
            onClick={fetchSystemData}
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold hover:bg-white/10 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            <span>🔄</span> Refresh Status
          </button>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="text-xs text-blue-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>🧹</span> Temporary Files Cleaner
              </div>
              <p className="text-xs text-gray-400 mb-4">Safely delete Windows & User temp files to free up disk storage and remove unnecessary cache clutter.</p>
              {lastCleanResult && <div className="text-xs text-emerald-400 mb-4 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">{lastCleanResult}</div>}
            </div>
            <button
              onClick={() => runAction('clean-temp', 'Temp Cleanup')}
              disabled={loadingAction !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loadingAction === 'Temp Cleanup' ? '⏳ Cleaning Temp Files...' : '🧹 Clean Temp Files Now'}
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <span>🌐</span> Network & DNS Optimizer
              </div>
              <p className="text-xs text-gray-400 mb-4">Flush the local Windows DNS resolver cache to fix connection issues, resolve IP conflicts, and speed up web browsing.</p>
            </div>
            <button
              onClick={() => runAction('flush-dns', 'DNS Flush')}
              disabled={loadingAction !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
            >
              {loadingAction === 'DNS Flush' ? '⏳ Flushing DNS Cache...' : '🌐 Flush DNS Resolver Cache'}
            </button>
          </div>
        </div>

        {/* Drives Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>💾</span> Storage & Drive Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drives.length === 0 ? (
              <div className="col-span-3 p-6 text-center text-xs text-gray-500 border border-white/10 rounded-2xl bg-white/[0.01]">
                Loading drive information...
              </div>
            ) : (
              drives.map((d, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-bold text-white">Drive {d.DriveLetter}:</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-gray-300">{d.FileSystemLabel || 'Local Disk'}</span>
                  </div>
                  <div className="text-xs text-gray-400 space-y-1 mt-3">
                    <div>Total Capacity: <span className="text-white font-medium">{d.SizeGB} GB</span></div>
                    <div>Free Space: <span className="text-emerald-400 font-medium">{d.FreeGB} GB</span></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Running Processes Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>⚡</span> Top Memory Consuming Processes
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400 font-semibold">
                  <tr>
                    <th className="p-3.5">Process Name</th>
                    <th className="p-3.5 text-right">Memory Usage (RAM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {processes.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="p-6 text-center text-gray-500">Loading process list...</td>
                    </tr>
                  ) : (
                    processes.map((p, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                        <td className="p-3.5 font-medium text-white">{p.Name}.exe</td>
                        <td className="p-3.5 text-right text-purple-400 font-semibold">{p.MemoryMB} MB</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
