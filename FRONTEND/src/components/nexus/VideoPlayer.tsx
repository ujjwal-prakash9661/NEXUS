import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    stream: MediaStream | null;
    isLocal?: boolean;
    className?: string;
}

export function VideoPlayer({ stream, isLocal = false, className }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={cn(
            "relative overflow-hidden rounded-2xl bg-black border border-primary/20",
            className
        )}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal} // Mute local to prevent feedback
                className={cn(
                    "w-full h-full object-cover",
                    isLocal && "scale-x-[-1]" // Mirror local video
                )}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-0.5 rounded text-xs text-white">
                {isLocal ? "You" : "Peer"}
            </div>
        </div>
    );
}
