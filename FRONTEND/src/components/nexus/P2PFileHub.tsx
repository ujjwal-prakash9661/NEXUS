import { Users, FileText, CheckCircle2, ArrowUpDown, Loader2, Download, Search, Send, UploadCloud, Clock, HardDrive } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useWebRTCContext } from "@/components/nexus/WebRTCProvider";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function P2PFileHub() {
  const {
    startCall,
    sendFiles,
    callStatus,
    fileProgress,
    incomingFile,
    lastReceivedFile,
    lookupUser,
    receivedHistory
  } = useWebRTCContext() as any;

  const [targetNexusId, setTargetNexusId] = useState("");
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleLookup = async () => {
    if (!targetNexusId.trim()) return;
    setIsSearching(true);
    try {
      const user = await lookupUser(targetNexusId);
      console.log("Lookup Result:", user);
      setTargetUser(user);
      toast.success(`Found user: ${user.name || user.nexusId}`);
    } catch (e) {
      toast.error("User not found");
      setTargetUser(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConnect = () => {
    console.log("Connect requested. Target User:", targetUser);
    if (targetUser && targetUser._id) {
      startCall(targetUser._id, false);
    } else {
      toast.error("Invalid user data: Missing ID");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(e.target.files);
    }
  };

  const handleSend = () => {
    if (selectedFiles && selectedFiles.length > 0) {
      sendFiles(Array.from(selectedFiles));
      setSelectedFiles(null); // Reset selection after queuing
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 h-full">
      {/* LEFT PANEL: Controls & Transfer */}
      <div className="lg:col-span-4 flex flex-col gap-4 md:gap-4 glass-panel p-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Transfer Control</h3>
            <p className="text-xs text-muted-foreground">My ID: <span className="text-primary font-mono select-all">{useAuth().user?.nexusId || "Unknown"}</span></p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/30 border border-primary/10">
          <span className="text-xs font-medium uppercase text-muted-foreground">Link Status</span>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${callStatus === 'connected' ? 'bg-nexus-green animate-pulse' : callStatus === 'calling' ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className={`text-xs font-bold ${callStatus === 'connected' ? 'text-nexus-green' : 'text-muted-foreground'}`}>
              {callStatus === 'connected' ? 'ACTIVE' : callStatus === 'calling' ? 'CONNECTING...' : 'STANDBY'}
            </span>
          </div>
        </div>

        {/* Connection Logic */}
        {callStatus === 'idle' ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase font-medium mb-1.5 block">Target Nexus ID</label>
              <div className="flex gap-2">
                <Input
                  key="nexus-id-input"
                  placeholder="e.g. NEX-816269"
                  value={targetNexusId || ""}
                  onChange={(e) => setTargetNexusId(e.target.value)}
                  className="bg-black/20 border-primary/20 font-mono text-sm"
                />
                <Button onClick={handleLookup} disabled={isSearching} variant="secondary" size="icon">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {targetUser && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {targetUser.name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium font-display">{targetUser.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{targetUser.nexusId}</p>
                  </div>
                </div>
                <Button onClick={handleConnect} className="w-full gap-2">
                  Initialize Link <ArrowUpDown className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            {/* Sending */}
            <div className="p-4 rounded-xl bg-secondary/10 border border-primary/10">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-primary" /> Outgoing Stream
              </h4>
              <div className="space-y-3">
                <Input
                  key="file-input"
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="text-xs cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-2 file:py-1 file:mr-2"
                />
                <Button onClick={handleSend} disabled={!selectedFiles || selectedFiles.length === 0 || fileProgress > 0} className="w-full gap-2" size="sm">
                  <Send className="w-3 h-3" /> Transmit {selectedFiles?.length || 0} File(s)
                </Button>
              </div>
              {fileProgress > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span>Encrypting & Sending</span>
                    <span>{fileProgress}%</span>
                  </div>
                  <Progress value={fileProgress} className="h-1" />
                </div>
              )}
            </div>

            {/* Receiving */}
            {incomingFile && (
              <div className="p-4 rounded-xl bg-nexus-green/5 border border-nexus-green/20 animate-in slide-in-from-bottom-2">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-nexus-green">
                  <Download className="w-4 h-4" /> Incoming Data
                </h4>
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-nexus-green" />
                  <div>
                    <p className="text-sm font-mono truncate max-w-[150px]">{incomingFile.meta.name}</p>
                    <p className="text-[10px] opacity-70">{(incomingFile.meta.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Progress value={incomingFile.progress} className="h-1 bg-nexus-green/20 [&>div]:bg-nexus-green" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: VAULT HISTORY */}
      <div className="lg:col-span-8 glass-panel p-4 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between pb-4 border-b border-primary/10 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg">Secure Vault Storage</h3>
              <p className="text-xs text-muted-foreground">Received Files History</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-secondary/20 text-xs font-mono text-muted-foreground">
            {receivedHistory?.length || 0} FILES STORED
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-nexus relative">
          <Table>
            <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-10">
              <TableRow className="hover:bg-transparent border-primary/10">
                <TableHead className="w-[40%]">Filename</TableHead>
                <TableHead>Sender ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivedHistory && receivedHistory.length > 0 ? (
                receivedHistory.map((file: any, i: number) => (
                  <TableRow key={i} className="border-primary/5 hover:bg-white/5 group">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100" />
                        <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{file.senderId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(file.timestamp).toLocaleTimeString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <a href={file.url} download={file.name}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-nexus-green hover:bg-nexus-green/10 hover:text-nexus-green">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-muted-foreground/50 text-sm">
                    No files received in this session.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
