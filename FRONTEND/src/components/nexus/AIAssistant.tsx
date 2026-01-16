import { useState, useRef, useEffect, useMemo } from "react";
import { Brain, X, Activity, Server, Radio, Cpu, Users, Shield, Zap, Globe, Scan, Target, Signal, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth, API_BASE_URL } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { io, Socket } from "socket.io-client";

// Mock Data for the Graph
const generateData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    value: 40 + Math.random() * 40,
    value2: 30 + Math.random() * 30
  }));
};

// Deterministic position generator
const getPos = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const dist = 30 + (Math.abs(hash) % 50); // 30% to 80% from center
  return {
    top: `${50 + dist * Math.sin(angle)}%`,
    left: `${50 + dist * Math.cos(angle)}%`
  };
};

export function AIAssistant() {
  const { token, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"network" | "pulse">("network");
  const [graphData, setGraphData] = useState(generateData());
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [pinging, setPinging] = useState(false);
  const [incomingSignal, setIncomingSignal] = useState<{ fromId: string } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  // Initialize Socket
  useEffect(() => {
    if (!token) return;

    // Connect to backend (remove /api from API_BASE_URL to get root)
    const socketUrl = API_BASE_URL.replace('/api', '');
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log("Nexus Uplink Established");
    });

    socketRef.current.on('ping-received', (data: any) => {
      setIncomingSignal({ fromId: data.from });

      // Clear signal visualization after 5 seconds
      setTimeout(() => setIncomingSignal(null), 5000);

      // Play sound effect if possible (optional)
      toast("INCOMING TRANSMISSION", {
        description: `SECURE SIGNAL RECEIVED FROM: ${data.fromNexusId || data.fromName}`,
        className: "border-cyan-500 bg-black/90 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]",
        icon: <Wifi className="w-5 h-5 text-cyan-400 animate-pulse" />,
        duration: 5000
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  // Live Graph Effect
  useEffect(() => {
    if (!isOpen || mode !== "pulse") return;
    const interval = setInterval(() => {
      setGraphData(prev => {
        const newData = [...prev.slice(1), {
          time: prev[prev.length - 1].time + 1,
          value: 40 + Math.random() * 40,
          value2: 30 + Math.random() * 30
        }];
        return newData;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, mode]);

  // Network Data
  const networkQuery = useQuery({
    queryKey: ["nexus-hierarchy"], // reusing endpoint
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/ai/hierarchy`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load network");
      return res.json();
    },
    enabled: isOpen && mode === "network" && !!token,
  });

  // Poll Real System Stats
  const statsQuery = useQuery({
    queryKey: ["nexus-stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/ai/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return { storageUsage: 0, integrity: 100, nodeCount: 0 };
      return res.json();
    },
    enabled: isOpen && mode === "pulse" && !!token,
    refetchInterval: 3000 // Poll every 3s
  });

  const nodes = networkQuery.data?.nodes || [];

  const handlePing = () => {
    if (!selectedNode || !socketRef.current) return;
    setPinging(true);

    // Simulate latency then emit
    setTimeout(() => {
      socketRef.current?.emit('ping-user', { targetId: selectedNode._id });
      setPinging(false);
      toast.success(`SIGNAL ESTABLISHED`, {
        description: `Handshake successful with node ${selectedNode.nexusId}`,
        className: "border-green-500/50 bg-black/80 text-green-50"
      });
    }, 1000);
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full",
          "bg-cyan-500 hover:bg-cyan-400 border border-cyan-300",
          "flex items-center justify-center group",
          "shadow-[0_0_20px_rgba(6,182,212,0.6)]",
          "transition-all duration-300 hover:scale-110 active:scale-95",
          "ai-pulse md:bottom-6 bottom-20",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <div className="absolute inset-0 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors" />
        <Brain className="w-8 h-8 text-black animate-pulse" />
      </button>

      {/* Main Container */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 w-[500px] max-w-[calc(100vw-32px)] h-[650px] max-h-[calc(100vh-100px)]",
          "bg-zinc-950 backdrop-blur-3xl border border-cyan-500/30 rounded-3xl overflow-hidden",
          "shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col",
          "transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-bottom-right",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-20 pointer-events-none"
        )}
      >
        {/* Holographic Header */}
        <div className="relative p-6 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-900/20 via-transparent to-transparent">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full group-hover:bg-cyan-500/30 transition-all" />
                <Brain className="w-8 h-8 text-cyan-400 relative z-10" />
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-cyan-400 tracking-widest">NEXUS CORE</h3>
                <div className="flex items-center gap-2">
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", mode === "network" ? "bg-cyan-500" : "bg-emerald-500")} />
                  <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">
                    {mode === "network" ? "Link: Stable" : "System Telemetry"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-md">
            <button
              onClick={() => setMode("network")}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 tracking-wider",
                mode === "network" ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/20" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Globe className="w-3.5 h-3.5" />
              NETWORK SCAN
            </button>
            <button
              onClick={() => setMode("pulse")}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 tracking-wider",
                mode === "pulse" ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              SYSTEM PULSE
            </button>
          </div>
        </div>

        {/* RADAR / NETWORK MODE */}
        {mode === "network" && (
          <div className="flex-1 relative flex flex-col items-center justify-center bg-black/50 overflow-hidden">

            {/* Radar Container */}
            <div className="relative w-[260px] h-[260px] md:w-[300px] md:h-[300px] shrink-0 mb-2 rounded-full border border-cyan-500/30 bg-black shadow-[0_0_50px_rgba(6,182,212,0.05)]">

              {/* Rings */}
              <div className="absolute inset-[15%] rounded-full border border-cyan-500/10" />
              <div className="absolute inset-[30%] rounded-full border border-cyan-500/10" />
              <div className="absolute inset-[45%] rounded-full border border-cyan-500/20" />
              <div className="absolute inset-0 rounded-full border border-cyan-500/30" />

              {/* Sweeping Scanner */}
              <div className="absolute inset-0 rounded-full animate-[spin_4s_linear_infinite] pointer-events-none z-10">
                <div className="w-full h-1/2 bg-gradient-to-r from-transparent via-transparent to-cyan-500/20 blur-sm transform origin-bottom" style={{ borderRight: '2px solid rgba(6,182,212,0.4)' }} />
              </div>

              {/* Nodes (Users) */}
              {nodes.map((node: any) => {
                const pos = getPos(node._id);
                const isAdmin = node.role === 'ADMIN' || node.role === 'SUPER_ADMIN';
                const isSelected = selectedNode?._id === node._id;
                const isSignalSender = incomingSignal?.fromId === node._id;
                const displayId = node.nexusId || `UNK-${node._id.slice(-6).toUpperCase()}`;

                return (
                  <div
                    key={node._id}
                    className={cn(
                      "absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center hover:z-50 cursor-pointer group transition-all tap-highlight-transparent",
                      isSelected && "z-50 scale-150",
                      isSignalSender && "z-50"
                    )}
                    style={{ top: pos.top, left: pos.left }}
                    onClick={() => { setSelectedNode(node); setPinging(false); }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* BOLD SIGNAL EFFECT */}
                    {isSignalSender && (
                      <>
                        {/* Main expanding ripple */}
                        <span className="absolute inset-0 -m-6 rounded-full border-2 border-white/80 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        {/* Secondary delayed ripple */}
                        <span className="absolute inset-0 -m-10 rounded-full border border-cyan-400/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-300" />
                        {/* Intense Core Glow */}
                        <span className="absolute w-4 h-4 rounded-full bg-white blur-sm animate-pulse shadow-[0_0_20px_white]" />
                      </>
                    )}

                    {/* Standard Blip Animation */}
                    {!isSignalSender && (
                      <span className={cn(
                        "absolute w-3 h-3 rounded-full animate-ping opacity-75 duration-2000",
                        isAdmin ? "bg-amber-500" : "bg-cyan-500"
                      )} />
                    )}

                    <span className={cn(
                      "relative block w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] transition-colors",
                      isSelected ? "bg-white shadow-[0_0_20px_white]" :
                        isSignalSender ? "bg-white text-white scale-125" :
                          (isAdmin ? "bg-amber-400 text-amber-500" : "bg-cyan-400 text-cyan-500")
                    )} />

                    {/* Connection Line (Visual) */}
                    {isSelected && (
                      <div className="absolute top-1/2 left-1/2 h-[1px] bg-gradient-to-r from-cyan-500 to-transparent origin-left -z-10 animate-in fade-in zoom-in"
                        style={{
                          transform: `rotate(${Math.atan2(50 - parseFloat(pos.top), 50 - parseFloat(pos.left)) * 180 / Math.PI + 180}deg)`,
                          width: '300px'
                        }}
                      />
                    )}

                    {/* Signal Trace Line (Pulsing connection to center) */}
                    {isSignalSender && (
                      <div className="absolute top-1/2 left-1/2 h-[2px] bg-gradient-to-r from-white via-cyan-400 to-transparent origin-left -z-10 animate-pulse"
                        style={{
                          transform: `rotate(${Math.atan2(50 - parseFloat(pos.top), 50 - parseFloat(pos.left)) * 180 / Math.PI + 180}deg)`,
                          width: '300px'
                        }}
                      />
                    )}
                  </div>
                )
              })}

              {/* Center Core */}
              <div className="absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse z-20" />
            </div>

            {/* INTERACTIVE PANEL / COMPACT STATUS BAR */}
            <div className="w-full z-20">
              {selectedNode ? (
                <div className="bg-zinc-950/90 border-t border-cyan-500/20 p-4 backdrop-blur-xl animate-in slide-in-from-bottom-2 shadow-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 shrink-0", selectedNode.role.includes('ADMIN') ? "bg-amber-500/20 text-amber-500" : "bg-cyan-500/20 text-cyan-500")}>
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-mono font-bold text-cyan-400 text-xs tracking-wider truncate">
                          {selectedNode.nexusId || `UNK-${selectedNode._id.slice(-6).toUpperCase()}`}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={cn("w-1 h-1 rounded-full", selectedNode.online ? "bg-green-500" : "bg-zinc-500")} />
                          <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">{selectedNode.role}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="p-2 text-zinc-500 hover:text-white"><X className="w-4 h-4" /></button>
                  </div>

                  {/* Compact Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black/40 px-3 py-2 rounded border border-white/5 flex items-center justify-between">
                      <span className="text-[9px] text-zinc-500 font-mono">LATENCY</span>
                      <span className="text-xs text-cyan-400 font-mono">{Math.floor(Math.random() * 40) + 10}ms</span>
                    </div>

                    <button
                      onClick={handlePing}
                      disabled={pinging}
                      className={cn(
                        "rounded font-bold text-[10px] tracking-widest transition-all border flex items-center justify-center gap-2 group h-full",
                        pinging ? "bg-green-500/10 text-green-400 border-green-500/50" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500 hover:text-black"
                      )}
                    >
                      {pinging ? <Wifi className="w-3 h-3 animate-ping" /> : <Signal className="w-3 h-3 group-hover:scale-110 transition-transform" />}
                      {pinging ? "SENDING..." : "PING TARGET"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-[60px] flex items-center justify-between px-6 bg-zinc-950/80 backdrop-blur-md border-t border-cyan-500/20">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-cyan-500/40 tracking-[0.2em] font-mono uppercase">System Status</span>
                    <span className="text-xs text-cyan-500/80 font-bold tracking-widest animate-pulse flex items-center gap-2">
                      <span className="w-1 h-1 bg-cyan-500 rounded-full shadow-[0_0_5px_cyan]" />
                      SCANNING...
                    </span>
                  </div>
                  <Scan className="w-5 h-5 text-cyan-500/20 animate-[spin_10s_linear_infinite]" />
                </div>
              )}
            </div>

            {/* Hover Profile Card (Simplified for ID) */}
            {hoveredNode && !selectedNode && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[180px] bg-black/90 border border-cyan-500/30 px-4 py-3 rounded-xl backdrop-blur-md shadow-xl z-50 pointer-events-none">
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">{hoveredNode.role}</p>
                  <p className="font-mono font-bold text-cyan-400 text-sm tracking-wider">
                    {hoveredNode.nexusId || "UNKNOWN_ID"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PULSE MODE */}
        {mode === "pulse" && (
          <div className="flex-1 p-6 flex flex-col gap-6 bg-black/40">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Cpu className="w-12 h-12 text-emerald-500" /></div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Core Integrity</span>
                <span className="text-2xl font-bold text-emerald-400 animate-in fade-in">{statsQuery.data?.integrity || "100"}%</span>
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-1"><div className="w-[98%] h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" /></div>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-20"><Server className="w-12 h-12 text-purple-500" /></div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Memory Nodes</span>
                <span className="text-2xl font-bold text-purple-400 animate-in fade-in">{statsQuery.data?.nodeCount || "0"}</span>
                <span className="text-[10px] text-purple-500/50 font-mono">{statsQuery.data?.storageUsage || "0"} KB Used</span>
              </div>
            </div>

            {/* Main Graph */}
            <div className="flex-1 bg-zinc-900/30 border border-white/5 rounded-3xl p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs text-zinc-400 font-mono uppercase tracking-widest flex items-center gap-2">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  Network Activity
                </h4>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/20">
                  {statsQuery.isFetching ? "SYNCING..." : "LIVE"}
                </span>
              </div>

              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" isAnimationActive={false} />
                    <Area type="monotone" dataKey="value2" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue2)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
