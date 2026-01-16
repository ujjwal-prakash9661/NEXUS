import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LogOut, Settings as SettingsIcon, UserCircle, Download, Lock, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface IdentityHeaderProps {
  onLockToggle: () => void;
  isLocked: boolean;
}

export function IdentityHeader({ onLockToggle, isLocked }: IdentityHeaderProps) {
  const { user, logout } = useAuth();


  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "System Secure", message: "Identity verification complete.", time: "Now", unread: true },
    { id: 2, title: "Update Available", message: "Nexus Protocol v2.1 is ready.", time: "2h ago", unread: false },
    { id: 3, title: "Welcome", message: "Connection established to Neural Link.", time: "1d ago", unread: false },
  ]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setInstallPrompt(null);
    });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 glass-panel border-b border-primary/10">
      {/* ... Left and Center sections ... */}
      <div className="flex md:hidden items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 neon-border">
          <span className="font-display font-bold text-primary text-sm">NX</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-base text-foreground">NEXUS</h1>
        </div>
      </div>

      <div className="hidden md:block">
        <h2 className="font-display text-sm text-muted-foreground tracking-wider">
          Cyber-Minimalism Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {installPrompt && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstall}
            className="hidden sm:flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Install NEXUS</span>
          </Button>
        )}

        <button
          onClick={onLockToggle}
          className={`p-2.5 rounded-lg border transition-all duration-300 ${isLocked
            ? "bg-destructive/20 border-destructive/50 text-destructive"
            : "bg-secondary/50 border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40"
            }`}
        >
          <Lock className="w-4 h-4" />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <button className="relative p-2.5 rounded-lg bg-secondary/50 border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all outline-none">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 bg-[#0f172a] border-slate-800 text-slate-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h4 className="font-semibold text-sm">Notifications</h4>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">No new notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${n.unread ? 'bg-primary/5' : ''}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-medium text-sm ${n.unread ? 'text-primary' : 'text-slate-300'}`}>{n.title}</span>
                      <span className="text-[10px] text-muted-foreground">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Dynamic User Profile with Dropdown */}
        <div className="flex items-center gap-3 pl-3 border-l border-primary/10">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-foreground">
              {user?.nexusId ? (user.nexusId.startsWith('NEX-') ? user.nexusId : `NEX-${user.nexusId}`) : "NEX-????"}
            </p>
            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${user?.online ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-slate-500"}`} />
                <span className="text-muted-foreground">{user?.online ? "Online" : "Offline"}</span>
              </span>
              <span className="text-primary/50">•</span>
              <span className="status-verified flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Face-ID Verified
              </span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="relative cursor-pointer transition-transform active:scale-95">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center border-2 border-primary/40 animate-pulse-glow hover:border-primary/80 transition-colors">
                  <span className="font-display font-bold text-primary text-sm">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : "NX"}
                  </span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-nexus-green border-2 border-background" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0f172a] border-slate-800 text-slate-200">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem className="cursor-pointer focus:bg-slate-800 focus:text-white">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-slate-800 focus:text-white">
                <Link to="/settings/security" className="flex items-center w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-900/20"
                onClick={() => logout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
