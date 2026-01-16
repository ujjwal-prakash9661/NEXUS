import { Mic, MicOff, Video, VideoOff, PhoneOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";
import { useState } from "react";

interface CallPanelProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    onEndCall: () => void;
    onSendFile: (file: File) => void;
}

export function CallPanel({ localStream, remoteStream, onEndCall, onSendFile }: CallPanelProps) {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onSendFile(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
            <div className="relative w-full max-w-5xl aspect-video grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remote Video (Large) */}
                <div className="relative h-full w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
                    {remoteStream ? (
                        <VideoPlayer stream={remoteStream} className="w-full h-full" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                            Connecting...
                        </div>
                    )}
                </div>

                {/* Local Video (PiP or Split) */}
                <div className="absolute top-4 right-4 w-48 aspect-video md:static md:w-full md:h-full md:aspect-auto rounded-2xl overflow-hidden bg-zinc-900 border border-primary/20 shadow-2xl">
                    <VideoPlayer stream={localStream} isLocal />
                </div>
            </div>

            {/* Controls */}
            <div className="mt-8 flex items-center gap-4 bg-secondary/50 p-4 rounded-full backdrop-blur-md border border-white/10">
                <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleMute}
                >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                <Button
                    variant={isVideoOff ? "destructive" : "secondary"}
                    size="icon"
                    className="rounded-full w-12 h-12"
                    onClick={toggleVideo}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    className="rounded-full w-14 h-14"
                    onClick={onEndCall}
                >
                    <PhoneOff className="w-6 h-6" />
                </Button>

                <div className="relative">
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload-call"
                        onChange={handleFileChange}
                    />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full w-12 h-12"
                        onClick={() => document.getElementById('file-upload-call')?.click()}
                    >
                        <Upload className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
