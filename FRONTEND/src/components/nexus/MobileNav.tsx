import {
  Shield, MessageSquare, FolderLock, LayoutDashboard,
  AppWindow,
  CheckSquare
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
  { icon: LayoutDashboard, label: "Admin", id: "admin", adminOnly: true },
  { icon: Shield, label: "Security", id: "security" },
  { icon: MessageSquare, label: "Messages", id: "messages" },
  { icon: FolderLock, label: "Vault", id: "vault" },
  { icon: AppWindow, label: "Utilities", id: "ai" },
  { icon: CheckSquare, label: "Tasks", id: "tasks" },
];

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const { isAdmin } = useAuth();
  const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-primary/20 safe-area-bottom px-1">
      <div className="grid grid-cols-6 gap-0.5 py-2">
        {visibleNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-all duration-200 min-w-0 w-full",
                isActive
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground hover:bg-white/5"
              )}
            >
              <item.icon
                className={cn(
                  "w-4 h-4 md:w-5 md:h-5 transition-all",
                  isActive && "drop-shadow-[0_0_8px_hsl(185,100%,50%)]"
                )}
              />
              <span className="text-[9px] font-medium truncate w-full text-center leading-none">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0.5 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
