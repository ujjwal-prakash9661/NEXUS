import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomingCallModalProps {
    callerId: string;
    onAccept: () => void;
    onReject: () => void;
    isDataOnly?: boolean;
}

export function IncomingCallModal({ callerId, onAccept, onReject, isDataOnly }: IncomingCallModalProps) {
    return (
        <div className="fixed top-4 right-4 z-[100] w-80 bg-background/90 backdrop-blur-xl border border-primary/30 shadow-2xl rounded-2xl p-4 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                    {isDataOnly ? <Video className="w-6 h-6 text-primary" /> : <Video className="w-6 h-6 text-primary" />}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {isDataOnly ? "Secure Data Link Request" : "Incoming Call"}
                    </p>
                    <p className="text-lg font-bold text-foreground truncate">{callerId}</p>
                </div>
            </div>

            <div className="flex gap-2 mt-4">
                <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={onReject}
                >
                    <PhoneOff className="w-4 h-4" /> Reject
                </Button>
                <Button
                    className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                    onClick={onAccept}
                >
                    <Phone className="w-4 h-4" /> {isDataOnly ? "Initialize Link" : "Accept"}
                </Button>
            </div>
        </div>
    );
}
