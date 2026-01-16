import { useState } from "react";
import {
  Shield,
  MessageSquare,
  FolderLock,
  Lock,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Settings,
  AppWindow,
  Terminal,
  Wifi
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Admin Panel", id: "admin", adminOnly: true },
  { icon: Shield, label: "Security", id: "security" },
  { icon: MessageSquare, label: "Messages", id: "messages" },
  { icon: FolderLock, label: "File Vault", id: "vault" },
  { icon: AppWindow, label: "Utilities", id: "ai" },
  { icon: CheckSquare, label: "Tasks", id: "tasks" },
];

interface NexusSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NexusSidebar({ activeTab, onTabChange }: NexusSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAuth();

  // Filter nav items based on user role
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col glass-panel border-r border-primary/10 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-primary/10">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 neon-border">
          <span className="font-display font-bold text-primary text-lg">NX</span>
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="font-display font-bold text-lg text-foreground">NEXUS</h1>
            <p className="text-xs text-muted-foreground">Cyber-Minimalism</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-primary/15 border border-primary/30 text-primary neon-border"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground border border-transparent",
                item.adminOnly && "border-l-2 border-l-yellow-400/50"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(185,100%,50%)]")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {!collapsed && item.adminOnly && (
                <span className="ml-auto text-[10px] text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-primary/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
