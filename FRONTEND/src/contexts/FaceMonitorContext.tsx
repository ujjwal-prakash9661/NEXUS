import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface FaceMonitorContextType {
    stream: MediaStream | null;
    isAuthorized: boolean;
    lastCheckTime: Date | null;
    videoRef: React.RefObject<HTMLVideoElement>;
}

const FaceMonitorContext = createContext<FaceMonitorContextType | undefined>(undefined);

export const useFaceMonitor = () => {
    const context = useContext(FaceMonitorContext);
    if (!context) {
        throw new Error("useFaceMonitor must be used within a FaceMonitorProvider");
    }
    return context;
};

export const FaceMonitorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(true); // Default valid until checked
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Initialize Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 320, height: 240, frameRate: 15 }
                });
                setStream(mediaStream);
            } catch (err) {
                console.error("Failed to access camera for monitoring", err);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Reactive Video Autoplay
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.error("Autoplay failed", e));
        }
    }, [stream, videoRef]);

    // Expose setters for the logic component (GlobalFaceMonitor) to update state
    // Actually, we can just pass the state setters or let the GlobalFaceMonitor use this context 
    // BUT GlobalFaceMonitor needs to Update this state. 
    // Let's attach state updating logic here or just expose dispatchers.
    // For simplicity, I'll allow external updates via extended interface or handling logic inside the Provider?
    // Let's keep logic separate. I will extend the context type to allow updates.

    const value = {
        stream,
        isAuthorized,
        lastCheckTime,
        videoRef,
        setIsAuthorized,
        setLastCheckTime
    };

    return (
        <FaceMonitorContext.Provider value={value as any}>
            {/* Hidden video element for processing if not displayed elsewhere */}
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{ position: 'fixed', top: -1000, left: -1000, visibility: 'hidden' }}
            />
            {children}
        </FaceMonitorContext.Provider>
    );
};
