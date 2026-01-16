import { CheckCircle2, Circle, Clock, Check, Users, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Task {
  _id: string;
  title: string;
  description: string;
  progress: number;
  status: "completed" | "in-progress" | "pending";
  dueDate: string;
  assignedTo?: {
    name: string;
    nexusId: string;
    email: string;
  };
  assignedBy?: {
    name: string;
  };
}

export function TaskModule() {
  const { token, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: [isAdmin ? 'admin-all-tasks' : 'my-tasks'],
    queryFn: async () => {
      const endpoint = isAdmin ? `${API_BASE_URL}/tasks/all` : `${API_BASE_URL}/tasks`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!token
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string, progress: number }) => {
      await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ progress })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      if (isAdmin) queryClient.invalidateQueries({ queryKey: ['admin-all-tasks'] });
      toast.success("Task Updated");
    }
  });

  const overallProgress = tasks.length
    ? Math.round(tasks.reduce((acc: number, task: Task) => acc + task.progress, 0) / tasks.length)
    : 0;

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-nexus-green" />;
      case "in-progress":
        return <Clock className="w-4 h-4 text-primary animate-pulse" />;
      case "pending":
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // --- ADMIN VIEW ---
  if (isAdmin) {
    return (
      <div className="glass-panel p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Global Directive Oversight
          </h3>
          <Badge variant="outline" className="text-primary border-primary/30">
            {tasks.length} Active Directives
          </Badge>
        </div>

        <div className="flex-1 overflow-auto scrollbar-nexus">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-xs text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
              <tr>
                <th className="p-3 rounded-tl-lg">Directive</th>
                <th className="p-3">Assignee</th>
                <th className="p-3">Due Date</th>
                <th className="p-3">Progress</th>
                <th className="p-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {tasks.map((task: Task) => (
                <tr key={task._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-3 font-medium text-foreground">
                    {task.title}
                    <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{task.description}</div>
                  </td>
                  <td className="p-3">
                    <span className="text-primary font-mono">{task.assignedTo?.nexusId || "Unassigned"}</span>
                  </td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 w-[20%]">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", task.status === 'completed' ? 'bg-nexus-green' : 'bg-primary')}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={cn(
                      "text-[10px] h-5",
                      task.status === 'completed' ? "text-nexus-green border-nexus-green/30" :
                        task.status === 'in-progress' ? "text-blue-400 border-blue-400/30" : "text-zinc-500"
                    )}>
                      {task.status.toUpperCase()}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No directives found in the registry.
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- USER VIEW ---
  return (
    <div className="glass-panel-hover p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm">Active Tasks</h3>
        <span className="text-primary text-sm font-medium">{overallProgress}% Complete</span>
      </div>

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="text-primary font-medium">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-nexus-green rounded-full transition-all duration-500 progress-glow"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto scrollbar-nexus">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">All directives completed. Awaiting orders.</p>
        ) : tasks.map((task: Task, index: number) => (
          <div
            key={task._id}
            className="p-3 rounded-lg bg-secondary/20 animate-fade-in group relative"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(task.status)}
              <div className="flex-1">
                <span className={cn(
                  "text-sm block transition-all",
                  task.status === "completed" ? "text-muted-foreground line-through decoration-primary/50" : "text-foreground"
                )}>
                  {task.title}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>

              {task.status !== "completed" && (
                <button
                  onClick={() => updateMutation.mutate({ id: task._id, progress: 100 })}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-nexus-green/20 text-nexus-green transition-all"
                  title="Mark Complete"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="h-1 bg-secondary rounded-full overflow-hidden ml-7">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  task.status === "completed" ? "bg-nexus-green" : task.status === "in-progress" ? "bg-primary" : "bg-muted-foreground/30"
                )}
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
