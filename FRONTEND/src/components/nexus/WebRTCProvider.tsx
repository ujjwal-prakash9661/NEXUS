import { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { socketService } from "@/services/socket";
import { useWebRTC } from "@/hooks/useWebRTC";
import { CallPanel } from "./CallPanel";
import { IncomingCallModal } from "./IncomingCallModal";

interface WebRTCContextType {
    startCall: (targetUserId: string) => void;
    // Expose other methods if needed
}

const WebRTCContext = createContext<WebRTCContextType | undefined>(undefined);

export function WebRTCProvider({ children }: { children: ReactNode }) {
    const { token, user } = useAuth();
    const webRTC = useWebRTC(user?.id);
    const {
        callStatus,
        localStream,
        remoteStream,
        incomingCaller,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        sendFiles
    } = webRTC;

    useEffect(() => {
        if (token) {
            socketService.connect(token);
        } else {
            socketService.disconnect();
        }
    }, [token]);

    return (
        <WebRTCContext.Provider value={{ ...webRTC }}>
            {children}

            {/* Mounted UI Components managed by the Hook State */}
            {callStatus === 'incoming' && incomingCaller && (
                <IncomingCallModal
                    callerId={incomingCaller.from}
                    onAccept={answerCall}
                    onReject={rejectCall}
                    isDataOnly={webRTC.isDataOnly}
                />
            )}

            {(callStatus === 'connected' || callStatus === 'calling') && !webRTC.isDataOnly && (
                <CallPanel
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onEndCall={endCall}
                    onSendFile={(file) => sendFiles([file])}
                />
            )}
        </WebRTCContext.Provider>
    );
}

export function useWebRTCContext() {
    const context = useContext(WebRTCContext);
    if (context === undefined) {
        throw new Error('useWebRTCContext must be used within a WebRTCProvider');
    }
    return context;
}
