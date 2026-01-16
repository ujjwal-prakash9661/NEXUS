import { Shield, Download, MessageSquare, Upload, Scan, Activity as ActivityIcon } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";

interface AuditLog {
  _id: string;
  action: string;
  target?: string;
  createdAt: string;
  actor?: {
    name: string;
    nexusId: string;
  };
  meta?: any;
}

export function ActivityLog() {
  const { token, user } = useAuth();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs'],
    enabled: !!token && (user as any)?.role === 'ADMIN', // Check role to prevent 403s
    queryFn: async () => {
      // NOTE: This endpoint is currently admin-protected. 
      // Regular users might get 403, handling gracefully is needed or a user-specific endpoint.
      const res = await fetch(`${API_BASE_URL}/admin/activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        // If 403/401, return empty list or handle differently
        if (res.status === 403) return [];
        throw new Error("Failed to fetch logs");
      }
      return res.json();
    }
  });

  const getIcon = (action: string) => {
    if (action.includes("LOGIN") || action.includes("AUTH")) return Shield;
    if (action.includes("UPLOAD") || action.includes("FILE")) return Upload;
    if (action.includes("LOCK") || action.includes("Security")) return Scan;
    return ActivityIcon;
  };

  return (
    <div className="glass-panel-hover p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">System Audit Stream</h3>
        <span className="text-xs text-muted-foreground">Live</span>
      </div>

      {/* Activity List */}
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-nexus min-h-0">
        {isLoading ? (
          <div className="text-xs text-muted-foreground text-center py-4">Syncing with Neural Core...</div>
        ) : logs.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-4">No recent system signatures detected.</div>
        ) : logs.map((log: AuditLog, index: number) => {
          const Icon = getIcon(log.action);
          return (
            <div
              key={log._id}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-primary bg-primary/10">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {log.action.replace(/_/g, " ")}
                </h4>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {log.actor?.name || "System"} • {log.target || "N/A"}
                </p>
                <span className="text-[10px] mt-1 inline-block text-primary/70 font-mono">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
