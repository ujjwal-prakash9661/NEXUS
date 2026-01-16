import { useState, useEffect, useRef } from "react";
import {
    Brain,
    Database,
    Activity,
    ShieldCheck,
    Terminal,
    AppWindow,
    Clock,
    Fingerprint,
    Copy,
    Check,
    Play,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth, API_BASE_URL } from "@/contexts/AuthContext";

export function NexusCommandCenter() {
    const { token } = useAuth();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const preRef = useRef<HTMLPreElement>(null);
    const [activeTab, setActiveTab] = useState<'code' | 'time' | 'uuid'>('code');
    const [logs, setLogs] = useState<string[]>([
        "[SYSTEM] Nexus Utilities Module Loaded",
        "[INFO] All systems nominal."
    ]);

    // Code Runner State
    const [code, setCode] = useState("// Write JavaScript here\nconsole.log('Nexus System Online');\n\nconst agent = 'Cortex';\nconsole.log(`Hello from ${agent}`);");
    const [output, setOutput] = useState<{ type: 'log' | 'error' | 'warn', content: string }[]>([]);

    // UUID State
    const [uuids, setUuids] = useState<string[]>([]);

    // Time State
    const [timestamp, setTimestamp] = useState<string>(Math.floor(Date.now() / 1000).toString());
    const [convertedTime, setConvertedTime] = useState<string>("");

    // Fake live logs
    useEffect(() => {
        const interval = setInterval(() => {
            if (Math.random() > 0.9) {
                const actions = ["[SYS] Garbage collection...", "[MEM] Optimizing heap...", "[UI] Refreshing verified."];
                setLogs(prev => [...prev.slice(-15), `${new Date().toLocaleTimeString()} ${actions[Math.floor(Math.random() * actions.length)]}`]);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Live Clock
    useEffect(() => {
        const timer = setInterval(() => {
            if (activeTab === 'time' && !convertedTime) {
                setTimestamp(Math.floor(Date.now() / 1000).toString());
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [activeTab, convertedTime]);

    const handleRunCode = async () => {
        setOutput([]);
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        const logs: { type: 'log' | 'error' | 'warn', content: string }[] = [];

        console.log = (...args) => logs.push({ type: 'log', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        console.error = (...args) => logs.push({ type: 'error', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
        console.warn = (...args) => logs.push({ type: 'warn', content: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });

        try {
            // Execute safe-ish
            const result = new Function(code)();
            if (result !== undefined) {
                console.log(result);
            }
        } catch (err: any) {
            console.error(err.message);
        } finally {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
            setOutput(logs);
            toast.success("Execution Complete");
        }
    };



    const handleGenerateUUID = () => {
        const newId = crypto.randomUUID();
        setUuids(prev => [newId, ...prev].slice(0, 10));
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} [ID] UUID Generated.`]);
        navigator.clipboard.writeText(newId);
        toast.success("UUID Copied to Clipboard");
    };

    const handleConvertTime = (val: string) => {
        setTimestamp(val);
        const ts = parseInt(val);
        if (!isNaN(ts)) {
            setConvertedTime(new Date(ts * 1000).toLocaleString());
        } else {
            setConvertedTime("Invalid Timestamp");
        }
    };

    return (
        <div className="h-auto md:h-full flex flex-col gap-4 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 flex-none">
                <StatsCard icon={Brain} label="Neural Status" value="ONLINE" color="text-green-500" sub="V2.0.4 Stable" />
                <StatsCard icon={Database} label="Vector Memory" value="8,492" color="text-cyan-500" sub="Embeddings Indexed" />
                <StatsCard icon={Activity} label="System Latency" value="12ms" color="text-yellow-500" sub="Optimal Range" />
                <StatsCard icon={ShieldCheck} label="Security Level" value="MAXIMUM" color="text-purple-500" sub="Protocol Omega" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-auto md:flex-1 md:min-h-0">

                {/* Main Interface - Nexus Utilities */}
                <div className="lg:col-span-2 glass-panel rounded-2xl border border-primary/10 p-4 md:p-6 flex flex-col gap-4 relative md:overflow-hidden h-auto md:h-full">

                    {/* Header & Tabs */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-primary/10 pb-4 relative z-10 flex-none">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                <AppWindow className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-display font-bold text-lg text-primary">Nexus Utilities</h3>
                                <p className="text-xs text-muted-foreground">Developer Toolkit V1.0</p>
                            </div>
                        </div>

                        <div className="flex bg-black/40 p-1 rounded-lg border border-primary/10">
                            {[
                                { id: 'code', icon: Terminal, label: 'Runner' },
                                { id: 'time', icon: Clock, label: 'Chrono' },
                                { id: 'uuid', icon: Fingerprint, label: 'Forge' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-bold transition-all",
                                        activeTab === tab.id
                                            ? "bg-primary text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                            : "text-zinc-500 hover:text-primary hover:bg-primary/5"
                                    )}
                                >
                                    <tab.icon className="w-3 h-3" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="relative md:flex-1 bg-black/40 border border-primary/10 rounded-xl md:overflow-hidden flex flex-col p-4 h-auto md:h-full">

                        {/* TAB: CODE RUNNER */}
                        {activeTab === 'code' && (
                            <div className="flex-1 flex flex-col h-full gap-4">
                                {/* Toolbar */}
                                <div className="flex justify-between items-center bg-primary/5 p-2 rounded-lg border border-primary/10">
                                    <div className="flex items-center gap-4 px-2">
                                        <div className="flex items-center gap-2 text-xs text-primary/70">
                                            <Terminal className="w-4 h-4" />
                                            <span className="font-bold">NEXUS CODE LAB</span>
                                        </div>
                                        <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-mono">
                                            JAVASCRIPT (NODE)
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRunCode}
                                            className="px-3 py-1.5 bg-primary text-black rounded-lg text-xs font-bold hover:bg-primary/90 flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
                                        >
                                            <Play className="w-3 h-3 fill-black" />
                                            RUN
                                        </button>
                                        <button
                                            onClick={() => setOutput([])}
                                            className="p-1.5 hover:bg-red-500/20 rounded text-zinc-500 hover:text-red-400 transition-colors"
                                            title="Clear Output"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Editor Area */}
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Code Editor */}
                                    <div className="flex flex-col gap-2 h-[300px] md:h-full">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Script Input</div>
                                        <div className="relative flex-1 bg-black/40 border border-primary/10 rounded-xl overflow-hidden group focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                                            <textarea
                                                ref={textareaRef}
                                                onScroll={() => {
                                                    if (preRef.current && textareaRef.current) {
                                                        preRef.current.scrollTop = textareaRef.current.scrollTop;
                                                    }
                                                }}
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                spellCheck={false}
                                                className="absolute inset-0 w-full h-full bg-transparent p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none text-transparent caret-primary z-10 selection:bg-primary/20 overflow-auto whitespace-pre-wrap break-words [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-primary/20 hover:[&::-webkit-scrollbar-thumb]:bg-primary/40 [&::-webkit-scrollbar-track]:bg-transparent"
                                            />
                                            <pre
                                                ref={preRef}
                                                className="absolute inset-0 p-4 font-mono text-xs leading-relaxed pointer-events-none whitespace-pre-wrap break-words overflow-auto no-scrollbar"
                                                dangerouslySetInnerHTML={{
                                                    __html: code.replace(/(\b(const|let|var|function|return|if|else|for|while|await|async|console)\b|(["'`])(?:(?=(\\?))\2.)*?\3|\b(\d+)\b|(\/\/.*))/g,
                                                        (match, p1, k, q, s, n, c) => {
                                                            if (c) return `<span class="text-zinc-500">${match}</span>`; // comments
                                                            if (k) return `<span class="text-purple-400 font-bold">${match}</span>`; // keywords
                                                            if (q) return `<span class="text-emerald-400">${match}</span>`; // strings
                                                            if (n) return `<span class="text-orange-400">${match}</span>`; // numbers
                                                            return `<span class="text-zinc-300">${match}</span>`;
                                                        }) || '<span class="text-zinc-600 italic">// Start coding...</span>'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Terminal Output */}
                                    <div className="flex flex-col gap-2 h-[300px] md:h-full">
                                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Console Output</div>
                                        <ScrollArea className="flex-1 bg-[#0a0a0a] border border-primary/10 rounded-xl p-4 font-mono text-xs">
                                            {output.length > 0 ? (
                                                <div className="space-y-1">
                                                    {output.map((line, i) => (
                                                        <div key={i} className={cn(
                                                            "border-b border-white/5 pb-1 font-mono break-all",
                                                            line.type === 'error' ? "text-red-400" :
                                                                line.type === 'warn' ? "text-yellow-400" : "text-zinc-300"
                                                        )}>
                                                            <span className="opacity-30 mr-2 select-none">$</span>
                                                            {line.content}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-zinc-800 italic">
                                                    Ready to execute...
                                                </div>
                                            )}
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: TIME */}
                        {activeTab === 'time' && (
                            <div className="flex-1 flex flex-col items-center justify-center gap-8 min-h-[400px] md:min-h-0">
                                <div className="text-center space-y-2">
                                    <div className="text-6xl font-display font-bold text-primary tracking-tighter">
                                        {Math.floor(Date.now() / 1000)}
                                    </div>
                                    <div className="text-sm text-primary/50 font-mono">CURRENT UNIX TIMESTAMP</div>
                                </div>

                                <div className="w-full max-w-md space-y-4 bg-primary/5 p-6 rounded-xl border border-primary/10">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-primary/70">CONVERT TIMESTAMP</label>
                                        <input
                                            type="text"
                                            value={timestamp}
                                            onChange={(e) => handleConvertTime(e.target.value)}
                                            className="w-full bg-black/40 border border-primary/20 rounded h-10 px-3 font-mono text-primary focus:outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-primary/70">HUMAN READABLE</label>
                                        <div className="w-full bg-black/40 border border-primary/10 rounded h-10 px-3 flex items-center font-mono text-zinc-300">
                                            {convertedTime || new Date().toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: UUID */}
                        {activeTab === 'uuid' && (
                            <div className="flex-1 flex flex-col h-full gap-4 min-h-[400px] md:min-h-0">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary/70">GENERATED IDENTIFIERS</span>
                                    <button
                                        onClick={handleGenerateUUID}
                                        className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-black hover:bg-primary/90 flex items-center gap-2"
                                    >
                                        <Fingerprint className="w-4 h-4" />
                                        GENERATE NEW
                                    </button>
                                </div>

                                <ScrollArea className="flex-1 -mx-2 px-2">
                                    <div className="space-y-2">
                                        {uuids.map((id, i) => (
                                            <div key={id} className="flex items-center justify-between bg-primary/5 border border-primary/10 p-3 rounded-lg group hover:border-primary/30 transition-all">
                                                <span className="font-mono text-sm text-primary/80">{id}</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(id);
                                                        toast.success("Copied");
                                                    }}
                                                    className="p-1.5 rounded hover:bg-primary/20 text-primary/50 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {uuids.length === 0 && (
                                            <div className="text-center text-zinc-600 py-10 italic">
                                                Press Generate to create cryptographically secure UUIDs.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sidebar - System Logs */}
                <div className="glass-panel rounded-2xl border border-primary/10 p-6 flex flex-col gap-4 bg-black/80 h-[300px] md:h-full">
                    <div className="flex items-center gap-3 border-b border-primary/10 pb-4 flex-none">
                        <Terminal className="w-5 h-5 text-zinc-400" />
                        <h3 className="font-mono font-bold text-sm text-zinc-400">SYSTEM_LOGS</h3>
                    </div>

                    <ScrollArea className="flex-1 font-mono text-xs">
                        <div className="space-y-2">
                            {logs.map((log, i) => (
                                <div key={i} className="text-zinc-500 border-l-2 border-transparent hover:border-primary/50 pl-2 py-0.5 transition-all">
                                    <span className="text-primary/40 mr-2">{">"}</span>
                                    {log}
                                </div>
                            ))}
                            <div className="w-2 h-4 bg-primary/50 animate-pulse mt-1" />
                        </div>
                    </ScrollArea>

                    <div className="text-[10px] text-zinc-600 font-mono pt-2 border-t border-white/5 flex justify-between">
                        <span>MEM: 32%</span>
                        <span>CPU: 15%</span>
                        <span>NET: IDLE</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ icon: Icon, label, value, color, sub }: any) {
    return (
        <div className="glass-panel p-4 rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent hover:border-primary/20 transition-all group">
            <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors", color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div className="text-2xl font-display font-bold text-foreground mb-0.5">{value}</div>
            <div className="text-xs text-muted-foreground font-medium">{label}</div>
            <div className="text-[10px] text-zinc-600 mt-2 font-mono uppercase tracking-wider">{sub}</div>
        </div>
    )
}
