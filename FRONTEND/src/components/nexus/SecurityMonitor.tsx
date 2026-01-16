import { Camera, Shield, Scan, Settings, Lock, Unlock } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useFaceMonitor } from "@/contexts/FaceMonitorContext";

export function SecurityMonitor() {
  const { stream, isAuthorized } = useFaceMonitor();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="glass-panel-hover p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-sm">Security Monitor</h3>
        </div>
        <Link to="/settings/security">
          <Settings className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer" />
        </Link>
      </div>

      <span className={`text-xs px-2 py-1 rounded-full w-fit mb-2 ${isAuthorized
        ? "bg-nexus-green/20 text-nexus-green"
        : "bg-red-500/20 text-red-500"
        }`}>
        {isAuthorized ? "Identity Verified" : "UNAUTHORIZED"}
      </span>

      {/* Camera Feed Area */}
      <div className="relative flex-1 min-h-[200px] bg-secondary/30 rounded-xl overflow-hidden border border-primary/10">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />

        {/* Grid Background Overlay */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

        {/* Scanning Line Animation */}
        <div className="scan-line pointer-events-none" />

        {/* UI Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`relative w-48 h-48 border-2 rounded-2xl transition-all duration-500 ${isAuthorized ? "border-nexus-green/50" : "border-red-500/50"
            }`}>
            {/* Corners */}
            <div className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg ${isAuthorized ? "border-nexus-green" : "border-red-500"}`} />
            <div className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg ${isAuthorized ? "border-nexus-green" : "border-red-500"}`} />
            <div className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg ${isAuthorized ? "border-nexus-green" : "border-red-500"}`} />
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 rounded-br-lg ${isAuthorized ? "border-nexus-green" : "border-red-500"}`} />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-50">
              {isAuthorized ? <Unlock className="w-8 h-8 text-nexus-green" /> : <Lock className="w-8 h-8 text-red-500" />}
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-4">
          <p className="text-center text-sm font-mono tracking-wider">
            {isAuthorized
              ? <span className="text-nexus-green flex items-center justify-center gap-2"><Scan className="w-3 h-3" /> ACTIVE MONITORING</span>
              : <span className="text-red-500 flex items-center justify-center gap-2"><Lock className="w-3 h-3" /> ACCESS RESTRICTED</span>
            }
          </p>
        </div>
      </div>
    </div>
  );
}
