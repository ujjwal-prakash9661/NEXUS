import {
  Shield, MessageSquare, FolderLock, LayoutDashboard,
  AppWindow,
  CheckSquare
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const navItems: NavItem[] = [
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
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-primary/20 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-all",
                  isActive && "drop-shadow-[0_0_8px_hsl(185,100%,50%)]"
                )}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute -bottom-0.5 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
