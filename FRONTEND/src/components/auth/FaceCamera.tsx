
import React, { useEffect, useRef, useState } from "react";
import { Camera, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaceCameraProps {
    isActive: boolean;
    isScanning?: boolean;
    onCameraReady?: () => void;
    className?: string;
    mode?: "login" | "register";
    onVideoRef?: (ref: HTMLVideoElement | null) => void;
}

const FaceCamera: React.FC<FaceCameraProps> = ({ isActive, isScanning = false, onCameraReady, className, mode = "login", onVideoRef }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState(false);

    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isActive]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                onVideoRef?.(videoRef.current);
            }
            setPermissionError(false);
            onCameraReady?.();
        } catch (err) {
            console.error("Camera error:", err);
            setPermissionError(true);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
        }
    };

    return (
        <div className={cn("relative flex items-center justify-center w-64 h-64", className)}>
            {/* Outer Glow Ring */}
            <div className={cn(
                "absolute inset-0 rounded-full border-2",
                isActive
                    ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                    : "border-slate-700",
                isScanning && "animate-pulse"
            )} />

            {/* Video / Placeholder Container */}
            <div className="relative w-56 h-56 overflow-hidden rounded-full bg-slate-900 flex items-center justify-center">
                {isActive && !permissionError ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform scale-x-[-1]"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 space-y-2">
                        <Camera className="w-12 h-12 mb-1" />
                        <span className="text-sm font-medium">Starting camera...</span>
                    </div>
                )}

                {/* Scanning Overlay (only when scanning) */}
                {isScanning && stream && (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent animate-scan z-10 pointer-events-none" />
                )}
            </div>

            {/* Error State */}
            {permissionError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 rounded-full z-20">
                    <div className="text-center p-4">
                        <span className="text-red-500 text-sm font-medium">Camera Access Denied</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FaceCamera;
