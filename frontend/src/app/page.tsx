"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import InteractiveHeroCanvas from "@/components/InteractiveHeroCanvas";
import { ShieldAlert, Activity, ShieldCheck, Server, Terminal, RefreshCw, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Alert {
  time: string;
  raw: string;
}

interface GraphPoint {
  time: string;
  threats: number;
  scans: number;
}

interface DashboardData {
  alerts: Alert[];
  attackCount: number;
  activeScans: number;
  firewallBlocks: number;
  serverLoad: string;
  graphData: GraphPoint[];
  status: string;
  estimatedFields?: string[];
}

const POLL_INTERVAL_MS = 8000;
const FETCH_TIMEOUT_MS = 8000;

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const inFlightRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel any request still in flight so overlapping polls can't race.
    inFlightRef.current?.abort();
    const controller = new AbortController();
    inFlightRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    setIsFetching(true);
    try {
      const res = await fetch("/api/splunk", { signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") {
        setError("Request timed out. Retrying shortly...");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load threat data.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    // Intentional fetch-on-mount: fetchData's setState calls happen
    // asynchronously after the await, not synchronously during this effect's
    // commit. It's kept as a shared, hoisted function so the manual
    // "Retry now" button can call it too.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();

    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchData, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    // Don't keep polling a backgrounded tab; refresh immediately on return.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchData();
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      inFlightRef.current?.abort();
    };
  }, [fetchData]);

  const isEstimated = (field: string) => data?.estimatedFields?.includes(field);

  return (
    <main className="flex min-h-screen flex-col items-center font-sans">
      {/* Background Animation */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <InteractiveHeroCanvas />
      </div>

      {/* Dashboard Overlay */}
      <div className="z-10 flex flex-col items-center w-full min-h-screen pt-12 px-6 pointer-events-none">

        {/* Header */}
        <div className="flex flex-col items-center mb-6 w-full max-w-7xl">
          <div className="flex items-center gap-4 mb-2">
            <ShieldAlert className="w-10 h-10 text-blue-400" />
            <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight">Zimbra SIEM</h1>
          </div>
          <p className="text-lg text-blue-300 drop-shadow-md flex items-center gap-2">
            Next-Gen Threat Detection
            <span className={`w-2 h-2 rounded-full ml-2 ${data?.status === 'live' ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
            <span className="text-sm font-mono text-gray-400 uppercase tracking-widest">
              {error ? 'connection error' : data?.status || 'Connecting...'}
            </span>
          </p>
        </div>

        {/* Error banner with manual retry */}
        {error && (
          <div className="w-full max-w-7xl mb-6 pointer-events-auto">
            <div className="flex items-center justify-between gap-4 bg-red-950/60 border border-red-500/40 rounded-xl px-5 py-3 text-red-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={fetchData}
                disabled={isFetching}
                className="flex items-center gap-2 text-sm font-semibold bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 transition-colors rounded-lg px-3 py-1.5"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                Retry now
              </button>
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-6 pointer-events-auto pb-12">

          {/* Top KPI Row (4 cols) */}
          <div className="md:col-span-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* KPI 1 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Total Threats</p>
                <p className={`text-4xl font-black ${data && data.attackCount > 0 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-emerald-400'}`}>
                  {data ? data.attackCount : "..."}
                </p>
              </div>
              <ShieldAlert className={`w-12 h-12 ${data && data.attackCount > 0 ? 'text-red-500/50' : 'text-emerald-500/50'}`} />
            </div>

            {/* KPI 2 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  Active Scans
                  {isEstimated('activeScans') && <span className="text-[10px] normal-case font-normal text-slate-500">(est.)</span>}
                </p>
                <p className="text-4xl font-black text-blue-400">
                  {data ? data.activeScans : "..."}
                </p>
              </div>
              <Activity className="w-12 h-12 text-blue-400/50" />
            </div>

            {/* KPI 3 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  Firewall Blocks
                  {isEstimated('firewallBlocks') && <span className="text-[10px] normal-case font-normal text-slate-500">(est.)</span>}
                </p>
                <p className="text-4xl font-black text-indigo-400">
                  {data ? data.firewallBlocks : "..."}
                </p>
              </div>
              <ShieldCheck className="w-12 h-12 text-indigo-400/50" />
            </div>

            {/* KPI 4 */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between hover:bg-slate-800/60 transition-colors">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1 flex items-center gap-1">
                  Server Load
                  {isEstimated('serverLoad') && <span className="text-[10px] normal-case font-normal text-slate-500">(est.)</span>}
                </p>
                <p className="text-4xl font-black text-amber-400">
                  {data ? data.serverLoad : "..."}
                </p>
              </div>
              <Server className="w-12 h-12 text-amber-400/50" />
            </div>
          </div>

          {/* Chart Section */}
          <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 tracking-wide flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Threat Activity (24h)
            </h2>
            <div className="flex-1 w-full h-full">
              {data?.graphData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.graphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#475569" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#475569" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                    />
                    <Area type="monotone" dataKey="scans" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScans)" />
                    <Area type="monotone" dataKey="threats" stroke="#ef4444" fillOpacity={1} fill="url(#colorThreats)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  {error ? "Chart unavailable" : "Loading chart..."}
                </div>
              )}
            </div>
          </div>

          {/* Live Log Table Card */}
          <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden flex flex-col h-[400px]">
            <h2 className="text-lg font-semibold text-slate-300 mb-4 tracking-wide flex items-center gap-2">
              <Terminal className="w-5 h-5 text-red-400" />
              Intercepted Payloads
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {data?.alerts && data.alerts.length > 0 ? (
                data.alerts.map((alert, i) => (
                  <div key={i} className="bg-black/60 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-gray-300 font-mono break-all hover:bg-black/80 transition-colors">
                    <span className="text-red-400 block mb-2 text-xs font-semibold">{alert.time}</span>
                    <span className="text-slate-200">{alert.raw}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 italic">
                  {error ? "Unable to load payload log." : "No threats detected recently."}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
