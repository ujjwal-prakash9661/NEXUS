import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { checkBackendHealth } from "@/lib/api";
import { NexusDashboard } from "@/components/nexus/NexusDashboard";

const Index = () => {
  const { user, logout } = useAuth();
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkBackendHealth().then(setIsBackendConnected);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Login overlay removed as per user request */}



      <div className="fixed bottom-4 right-4 z-50 pointer-events-none flex flex-col items-end gap-2">
        {/* Admin Link - Responsive & Conditional */}
        {isBackendConnected === null ? (
          <Badge variant="outline" className="bg-background/80 backdrop-blur">Checking Backend...</Badge>
        ) : isBackendConnected ? (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Backend Connected</Badge>
        ) : (
          <Badge variant="destructive">Backend Disconnected</Badge>
        )}
      </div>
      <NexusDashboard />
    </div>
  );
};

export default Index;
