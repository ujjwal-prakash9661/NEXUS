import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/services/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { CallPanel } from "./CallPanel";
import { IncomingCallModal } from "./IncomingCallModal";

export function CallOverlay() {
    const { token, user } = useAuth();
    const {
        callStatus,
        localStream,
        remoteStream,
        incomingCaller,
        answerCall,
        rejectCall,
        endCall,
        sendFile
    } = useWebRTC(user?.id); // Ensure user.id is passed

    // Initialize socket connection on mount/token change
    useEffect(() => {
        if (token) {
            socketService.connect(token);
        } else {
            socketService.disconnect();
        }
    }, [token]);

    if (callStatus === 'incoming' && incomingCaller) {
        // Show caller ID or Name - In a real app check your contacts list
        return (
            <IncomingCallModal
                callerId={incomingCaller.from}
                onAccept={answerCall}
                onReject={rejectCall}
            />
        );
    }

    if (callStatus === 'connected' || callStatus === 'calling') {
        return (
            <CallPanel
                localStream={localStream}
                remoteStream={remoteStream}
                onEndCall={endCall}
                onSendFile={sendFile}
            />
        );
    }

    return null;
}
