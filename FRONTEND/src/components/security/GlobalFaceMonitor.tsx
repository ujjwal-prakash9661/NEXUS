import React, { useEffect } from "react";
import { useFaceMonitor } from "@/contexts/FaceMonitorContext";
import { detectFace, loadModels } from "@/lib/face.service";
import { API_BASE_URL, useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

export const GlobalFaceMonitor: React.FC = () => {
    const { videoRef, setIsAuthorized, setLastCheckTime, isAuthorized } = useFaceMonitor() as any;
    const { token } = useAuth();
    const [modelsLoaded, setModelsLoaded] = React.useState(false);

    useEffect(() => {
        loadModels().then(() => {
            console.log("GlobalFaceMonitor: Models loaded");
            setModelsLoaded(true);
        });
    }, []);

    const isChecking = React.useRef(false);
    const mounted = React.useRef(true);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    useEffect(() => {
        if (!token) return;

        const presenceLoop = async () => {
            if (!mounted.current) return;
            if (!modelsLoaded || !videoRef.current || videoRef.current.paused || videoRef.current.ended) {
                setTimeout(presenceLoop, 500);
                return;
            }

            if (isChecking.current) {
                setTimeout(presenceLoop, 100);
                return;
            }

            isChecking.current = true;

            try {
                // 1. Detect Face
                const descriptor = await detectFace(videoRef.current);

                if (!descriptor) {
                    // No face -> Lock immediately (Local)
                    if (mounted.current) setIsAuthorized(false);
                    isChecking.current = false;
                    setTimeout(presenceLoop, 200); // Check again fast
                    return;
                }

                // 2. Face found -> Verify with Backend
                const descriptorArray = Array.from(descriptor);
                // console.log("Monitor: Sending Token:", token?.substring(0, 10) + "...");
                const response = await fetch(`${API_BASE_URL}/vault/presence-check`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ descriptor: descriptorArray }),
                });

                if (!mounted.current) return;

                if (response.ok) {
                    const data = await response.json();
                    if (data.status === 'ACTIVE') {
                        setIsAuthorized(true);
                        setLastCheckTime(new Date());
                    } else {
                        // Authorized user mismatch
                        setIsAuthorized(false);
                    }
                } else {
                    // 403 or error
                    setIsAuthorized(false);
                }

            } catch (err) {
                console.error("Presence loop error", err);
                if (mounted.current) setIsAuthorized(false);
            } finally {
                isChecking.current = false;
                if (mounted.current) setTimeout(presenceLoop, 500); // Loop
            }
        };

        presenceLoop();
    }, [token, modelsLoaded, videoRef]);

    // Locked Screen Overlay
    if (!isAuthorized && token) {
        return (
            <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-3xl flex items-center justify-center transition-all duration-500">
                <div className="bg-[#0f172a]/80 border border-red-500/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center max-w-sm mx-4 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                        <Lock className="w-10 h-10 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2 font-display tracking-widest uppercase">System Locked</h2>
                    <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                        Biometric verification failed. User presence is required to access sensitive data.
                    </p>
                    <div className="flex justify-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-[bounce_1s_infinite_0ms]" />
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-[bounce_1s_infinite_200ms]" />
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-[bounce_1s_infinite_400ms]" />
                    </div>
                    <p className="text-xs text-red-500/60 mt-6 uppercase tracking-widest">Scanning...</p>
                </div>
            </div>
        );
    }

    return null;
};
