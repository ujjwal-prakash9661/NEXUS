import { useState, useEffect } from "react";
import { NexusSidebar } from "./NexusSidebar";
import { IdentityHeader } from "./IdentityHeader";
import { SecurityMonitor } from "./SecurityMonitor";
import { ActivityLog } from "./ActivityLog";
import { TaskModule } from "./TaskModule";
import { P2PFileHub } from "./P2PFileHub";
import { AIAssistant } from "./AIAssistant";
import { PrivacyLockModal } from "./PrivacyLockModal";
import { MobileNav } from "./MobileNav";
import { Messages } from "./Messages";
import { AdminDashboard } from "./AdminDashboard";
import { NexusCommandCenter } from "./NexusCommandCenter";
import { useAuth } from "@/contexts/AuthContext";

export function NexusDashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("nexus_active_tab") || "security";
  });

  useEffect(() => {
    localStorage.setItem("nexus_active_tab", activeTab);
  }, [activeTab]);

  const [isLocked, setIsLocked] = useState(false);
  const { isAdmin, isLoading } = useAuth();

  // Redirect non-admins away from admin tab
  useEffect(() => {
    if (!isLoading && activeTab === "admin" && !isAdmin) {
      setActiveTab("security");
    }
  }, [activeTab, isAdmin, isLoading]);

  const renderContent = () => {
    switch (activeTab) {
      case "admin":
        return isAdmin ? <AdminDashboard /> : null;
      case "security":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 grid-rows-1 lg:grid-rows-2 gap-3 md:gap-4 h-[calc(100vh-100px)] max-w-full mx-auto pb-2">
            <div className="lg:col-span-7 xl:col-span-8 row-span-1 min-h-0">
              <SecurityMonitor />
            </div>
            <div className="lg:col-span-5 xl:col-span-4 row-span-1 min-h-0">
              <ActivityLog />
            </div>
            <div className="lg:col-span-6 row-span-1 min-h-0">
              <TaskModule />
            </div>
            <div className="lg:col-span-6 row-span-1 min-h-0">
              <P2PFileHub />
            </div>
          </div>
        );
      case "messages":
        return <Messages />;
      case "vault":
        return (
          <div className="max-w-full mx-auto h-[calc(100vh-140px)]">
            <P2PFileHub />
          </div>
        );
      case "ai":
        return (
          <div className="max-w-7xl mx-auto h-[calc(100vh-140px)]">
            <NexusCommandCenter />
          </div>
        );
      case "tasks":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-full mx-auto h-[calc(100vh-140px)] pb-2">
            <div className="min-h-0 h-full">
              <TaskModule />
            </div>
            <div className="min-h-0 h-full">
              <ActivityLog />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-[0.02] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Layout */}
      <div className="flex min-h-screen w-full">
        {/* Sidebar (Desktop) */}
        <NexusSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <IdentityHeader onLockToggle={() => setIsLocked(!isLocked)} isLocked={isLocked} />

          {/* Dashboard Content */}
          <main className="flex-1 p-3 md:p-6 pb-24 md:pb-6 overflow-y-auto scrollbar-nexus">
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* AI Assistant */}
      <AIAssistant />

      {/* Privacy Lock Modal */}
      <PrivacyLockModal isLocked={isLocked} onUnlock={() => setIsLocked(false)} />
    </div>
  );
}
