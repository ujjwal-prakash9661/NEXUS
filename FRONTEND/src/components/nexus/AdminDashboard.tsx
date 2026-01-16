import { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  MessageSquare,
  TrendingUp,
  Shield,
  AlertTriangle,
  RefreshCw,
  Lock,
  ShieldAlert,
  Activity,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL, useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: "cyan" | "green" | "red" | "yellow" | "purple";
  isLoading?: boolean;
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color, isLoading }: StatCardProps) {
  const colorClasses = {
    cyan: "text-primary bg-primary/10 border-primary/30",
    green: "text-nexus-green bg-nexus-green/10 border-nexus-green/30",
    red: "text-destructive bg-destructive/10 border-destructive/30",
    yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    purple: "text-accent bg-accent/10 border-accent/30",
  };

  return (
    <div className="glass-panel rounded-2xl border border-primary/10 p-5 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center border",
          colorClasses[color]
        )}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trendUp ? "text-nexus-green bg-nexus-green/10" : "text-destructive bg-destructive/10"
          )}>
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-display font-bold text-foreground mb-1">
          {isLoading ? (
            <span className="inline-block w-16 h-7 bg-muted/50 rounded animate-pulse" />
          ) : (
            value
          )}
        </p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

function TaskAssignmentForm({ token }: { token: string }) {
  const [nexusId, setNexusId] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");

  const assignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE_URL}/tasks/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nexusId, title, description: desc, dueDate })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to assign");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Task Assigned Successfully");
      setNexusId(""); setTitle(""); setDesc(""); setDueDate("");
    },
    onError: (err: Error) => toast.error(err.message)
  });

  return (
    <div className="glass-panel p-6 rounded-2xl border border-primary/10 max-w-2xl">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <CheckSquare className="w-5 h-5 text-nexus-green" />
        Assign New Task
      </h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Target User (Nexus ID)</label>
          <input
            value={nexusId}
            onChange={e => setNexusId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 outline-none"
            placeholder="e.g. NEX-8294"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Task Title</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 outline-none"
            placeholder="e.g. Audit Core Systems"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 outline-none min-h-[80px]"
            placeholder="Detailed instructions..."
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Due Date</label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm focus:border-primary/50 outline-none [color-scheme:dark]"
          />
        </div>
        <Button
          className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
          onClick={() => assignMutation.mutate()}
          disabled={!nexusId || !title || !dueDate || assignMutation.isPending}
        >
          {assignMutation.isPending ? "Assigning..." : "Dispatch Directive"}
        </Button>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // --- Queries ---
  const { data: summary, isLoading } = useQuery({
    queryKey: ['adminSummary'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    refetchInterval: 30000
  });

  const { data: pendingUsers } = useQuery({
    queryKey: ['pendingUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/pending-users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: allUsers } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: activity } = useQuery({
    queryKey: ['activityLog'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  // --- Mutations ---
  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE_URL}/admin/approve-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      toast.success("User Approved");
      queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminSummary'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    }
  });

  const lockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE_URL}/admin/lock-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      return res.json();
    },
    onSuccess: () => {
      toast.warning("User Locked");
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminSummary'] });
    }
  });

  const forceLockMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`${API_BASE_URL}/admin/force-lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId })
      });
      return res.json();
    },
    onSuccess: () => {
      toast.error("User Forcefully Terminated");
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminSummary'] });
    }
  });

  return (
    <div className="space-y-6 max-w-full mx-auto pb-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            Admin Command Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time system overview and user management
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['adminSummary'] });
            queryClient.invalidateQueries({ queryKey: ['pendingUsers'] });
            queryClient.invalidateQueries({ queryKey: ['allUsers'] });
            queryClient.invalidateQueries({ queryKey: ['activityLog'] });
            toast.info("Refreshing dashboard data...");
          }}
          disabled={isLoading}
          className="border-primary/30 text-primary hover:bg-primary/10 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Users"
          value={summary?.totalUsers || 0}
          icon={Users}
          color="cyan"
          trend="12%"
          trendUp={true}
          isLoading={isLoading}
        />
        <StatCard
          title="Online Now"
          value={summary?.onlineUsers || 0}
          icon={UserCheck}
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          title="Pending Approval"
          value={summary?.pendingUsers || 0}
          icon={Clock}
          color="yellow"
          isLoading={isLoading}
        />
        <StatCard
          title="Locked Accounts"
          value={summary?.lockedUsers || 0}
          icon={UserX}
          color="red"
          isLoading={isLoading}
        />
        <StatCard
          title="Messages Today"
          value={summary?.messagesToday?.toLocaleString() || 0}
          icon={MessageSquare}
          color="purple"
          trend="8%"
          trendUp={true}
          isLoading={isLoading}
        />
      </div>

      {/* Main Content Tabs (Replacing Quick Actions) */}
      <div className="glass-panel rounded-2xl border border-primary/10 p-6">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="bg-primary/5 p-1 border border-primary/10 w-full justify-start overflow-x-auto">
            <TabsTrigger value="pending" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Pending Approvals</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">User Management</TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Audit Logs</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Assign Tasks</TabsTrigger>
          </TabsList>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-6">
            <TaskAssignmentForm token={token} />
          </TabsContent>

          {/* Pending Users Tab */}
          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingUsers?.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground bg-primary/5 rounded-lg border border-primary/10 border-dashed">
                No pending user requests
              </div>
            ) : (
              pendingUsers?.map((user: any) => (
                <div key={user._id} className="bg-background/40 border border-primary/10 flex flex-col md:flex-row justify-between items-center p-4 rounded-xl gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-amber-500 font-bold border border-amber-500/30">
                      {user.name ? user.name[0].toUpperCase() : "?"}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 w-full md:w-auto">Deny</Button>
                    <Button
                      size="sm"
                      className="bg-green-600/80 hover:bg-green-600 text-white w-full md:w-auto"
                      onClick={() => approveMutation.mutate(user._id)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* All Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="grid gap-4 h-[calc(100vh-320px)] overflow-y-auto scrollbar-nexus pr-2">
              {allUsers?.map((user: any) => (
                <div key={user._id} className="bg-background/40 border border-primary/10 p-4 flex flex-col md:flex-row items-center justify-between rounded-xl gap-4">
                  <div className="flex items-center gap-4 w-full">
                    <div className={`w-2 h-2 rounded-full ${user.online ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`} />
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-2 flex-wrap">
                        {user.name}
                        {user.role === 'ADMIN' && <Badge variant="secondary" className="text-[10px] h-5 bg-yellow-400/10 text-yellow-400 border-yellow-400/20">ADMIN</Badge>}
                        {user.status === 'LOCKED' && <Badge variant="destructive" className="text-[10px] h-5">LOCKED</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{user.email} • ID: {user.nexusId}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {user.status === 'LOCKED' ? (
                      <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(user._id)} className="w-full md:w-auto">Unlock</Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 w-full md:w-auto"
                          onClick={() => lockMutation.mutate(user._id)}
                        >
                          <Lock className="w-4 h-4 mr-1" /> Lock
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 w-full md:w-auto"
                          onClick={() => forceLockMutation.mutate(user._id)}
                        >
                          <ShieldAlert className="w-4 h-4 mr-1" /> Kill
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="bg-background/30 rounded-lg border border-primary/10 overflow-hidden h-[calc(100vh-320px)] overflow-y-auto scrollbar-nexus">
              {activity?.map((log: any, i: number) => (
                <div key={i} className="p-4 border-b border-primary/5 flex items-center justify-between hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{log.action || "User Action"}</span>
                      <span className="text-xs text-muted-foreground">{log.details ? JSON.stringify(log.details).slice(0, 50) : "No details"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {/* <span className="text-xs text-muted-foreground block">{new Date(log.timestamp).toLocaleTimeString()}</span> */}
                    <span className="text-[10px] text-primary/50">{new Date(log.timestamp || Date.now()).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
