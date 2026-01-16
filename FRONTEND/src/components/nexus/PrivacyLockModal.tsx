import { ShieldAlert, Scan, Fingerprint } from "lucide-react";
import { useEffect, useState } from "react";

interface PrivacyLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export function PrivacyLockModal({ isLocked, onUnlock }: PrivacyLockModalProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [status, setStatus] = useState<"detecting" | "scanning" | "failed">("detecting");

  useEffect(() => {
    if (isLocked) {
      setScanProgress(0);
      setStatus("detecting");

      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            setStatus("failed");
            return 0;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" />

      {/* Lock Modal */}
      <div className="relative glass-panel border border-destructive/30 rounded-3xl p-8 max-w-md mx-4 animate-scale-in">
        {/* Alert Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center border-2 border-destructive/50 animate-pulse">
              <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>
            <div className="absolute inset-0 rounded-full border-2 border-destructive/30 animate-ping" />
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <h2 className="font-display text-xl font-bold text-destructive mb-2 uppercase tracking-wider">
            Identity Not Detected
          </h2>
          <p className="text-sm text-muted-foreground">
            {status === "detecting" && "Searching for registered biometric signature..."}
            {status === "scanning" && "Attempting facial recognition..."}
            {status === "failed" && "Authentication required to access dashboard"}
          </p>
        </div>

        {/* Scanning Animation */}
        <div className="relative mb-6">
          <div className="w-full h-24 bg-secondary/30 rounded-xl overflow-hidden border border-destructive/20">
            {/* Grid */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />
            
            {/* Scan Line */}
            <div 
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-destructive to-transparent transition-all duration-100"
              style={{ top: `${scanProgress}%` }}
            />

            {/* Fingerprint Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Fingerprint className="w-12 h-12 text-destructive/40" />
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Re-authenticating...</span>
            <span className="text-destructive">{scanProgress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-destructive to-nexus-amber rounded-full transition-all duration-100"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onUnlock}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 hover:border-primary/60 transition-all font-medium"
        >
          <Scan className="w-4 h-4" />
          Manual Authentication
        </button>

        {/* Security Notice */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          All data widgets are encrypted and protected
        </p>
      </div>
    </div>
  );
}
