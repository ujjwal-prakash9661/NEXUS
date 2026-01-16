import { useEffect, useRef, useState, useCallback } from 'react';
import { socketService } from '@/services/socket';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/contexts/AuthContext';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

interface FileMeta {
    id: string;
    name: string;
    size: number;
    type: string;
}

interface IncomingFileState {
    meta: FileMeta;
    receivedBytes: number;
    chunks: ArrayBuffer[];
    progress: number;
}

interface WebRTCState {
    callStatus: CallStatus;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    incomingCaller: { from: string; offer: RTCSessionDescriptionInit } | null;
    remotePeerId: string | null;
    fileProgress: number; // 0-100 for sending
    incomingFile: IncomingFileState | null;
    downloadUrl: string | null;
    lastReceivedFile: { name: string, url: string } | null;
    receivedHistory: { id: string, name: string, size: number, senderId: string, timestamp: Date, url: string }[];
    isDataOnly: boolean;
}

export function useWebRTC(currentUserId: string | undefined) {
    const [state, setState] = useState<WebRTCState>({
        callStatus: 'idle',
        localStream: null,
        remoteStream: null,
        incomingCaller: null,
        remotePeerId: null,
        fileProgress: 0,
        incomingFile: null,
        downloadUrl: null,
        lastReceivedFile: null,
        receivedHistory: [],
        isDataOnly: false
    });

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const fileReader = useRef<FileReader | null>(null);
    const remotePeerIdRef = useRef<string | null>(null); // Ref to track peer ID across closures

    // ICE Servers (STUN/TURN)
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
        ],
    };

    const initializePeerConnection = useCallback(() => {
        if (peerConnection.current) return peerConnection.current;

        const pc = new RTCPeerConnection(rtcConfig);
        peerConnection.current = pc;

        // Handle ICE Candidates
        pc.onicecandidate = (event) => {
            if (event.candidate && remotePeerIdRef.current) {
                socketService.emit('webrtc-ice-candidate', {
                    to: remotePeerIdRef.current,
                    candidate: event.candidate,
                });
            }
        };

        // Handle Remote Stream (for Video Calls)
        pc.ontrack = (event) => {
            console.log("Remote stream received");
            setState(prev => ({ ...prev, remoteStream: event.streams[0] }));
        };

        // Handle Data Channel (Receiver)
        pc.ondatachannel = (event) => {
            setupDataChannel(event.channel);
        };

        return pc;
    }, []); // Removed dependency to avoid recreation loops, uses Ref now

    const setupDataChannel = (channel: RTCDataChannel) => {
        channel.onopen = () => {
            console.log("Data Channel Open");
            toast.success("P2P Data Link Established");
        };

        channel.onmessage = handleDataChannelMessage;
        dataChannel.current = channel;
    };

    const handleDataChannelMessage = (event: MessageEvent) => {
        const { data } = event;

        // 1. Metadata Message (String JSON)
        if (typeof data === 'string') {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'FILE_START') {
                    setState(prev => ({
                        ...prev,
                        incomingFile: {
                            meta: msg.meta,
                            receivedBytes: 0,
                            chunks: [],
                            progress: 0
                        }
                    }));
                    toast.info(`Receiving ${msg.meta.name}...`);
                } else if (msg.type === 'FILE_END') {
                    finalizeDownload();
                }
            } catch (e) {
                console.error("Failed to parse signalling message", e);
            }
            return;
        }

        // 2. Binary Chunk
        if (data instanceof ArrayBuffer) {
            setState(prev => {
                if (!prev.incomingFile) return prev;

                const newChunks = [...prev.incomingFile.chunks, data];
                const newReceived = prev.incomingFile.receivedBytes + data.byteLength;
                const progress = Math.round((newReceived / prev.incomingFile.meta.size) * 100);

                return {
                    ...prev,
                    incomingFile: {
                        ...prev.incomingFile,
                        receivedBytes: newReceived,
                        chunks: newChunks,
                        progress
                    }
                };
            });
        }
    };

    const finalizeDownload = () => {
        setState(prev => {
            if (!prev.incomingFile) return prev;

            const blob = new Blob(prev.incomingFile.chunks, { type: prev.incomingFile.meta.type });
            const url = URL.createObjectURL(blob);

            toast.success(`Received ${prev.incomingFile.meta.name}`);

            const newFile = {
                id: prev.incomingFile.meta.id,
                name: prev.incomingFile.meta.name,
                size: prev.incomingFile.meta.size,
                senderId: prev.remotePeerId || "Unknown",
                timestamp: new Date(),
                url
            };

            return {
                ...prev,
                downloadUrl: url,
                lastReceivedFile: { name: prev.incomingFile.meta.name, url },
                incomingFile: null,
                receivedHistory: [newFile, ...prev.receivedHistory]
            };
        });
    };

    const lookupUser = async (nexusId: string) => {
        const token = localStorage.getItem("nexus_token");
        const res = await fetch(`${API_BASE_URL}/chat/lookup?nexusId=${nexusId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("User not found");
        return res.json();
    };

    const startCall = async (targetUserId: string, video = true) => {
        if (!targetUserId) {
            console.error("startCall called with missing targetUserId");
            toast.error("Cannot connect: Invalid Target ID");
            return;
        }

        // FAST UPDATE REF
        remotePeerIdRef.current = targetUserId;

        setState(prev => ({ ...prev, callStatus: 'calling', remotePeerId: targetUserId, isDataOnly: !video }));

        try {
            const pc = initializePeerConnection();

            if (video) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setState(prev => ({ ...prev, localStream: stream }));
                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            }

            // Create Data Channel (Caller)
            const channel = pc.createDataChannel("fileTransfer");
            setupDataChannel(channel);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socketService.emit('webrtc-offer', { to: targetUserId, offer, isDataOnly: !video });
        } catch (err) {
            console.error("Failed to start call:", err);
            toast.error("Connection failed");
            endCall();
        }
    };

    const answerCall = async () => {
        if (!state.incomingCaller || !currentUserId) return;
        const targetUserId = state.incomingCaller.from;

        // FAST UPDATE REF
        remotePeerIdRef.current = targetUserId;

        setState(prev => ({ ...prev, callStatus: 'connected', remotePeerId: targetUserId, incomingCaller: null }));

        try {
            const pc = initializePeerConnection();

            // Get User Media ONLY if not data-only
            if (!state.isDataOnly) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setState(prev => ({ ...prev, localStream: stream }));
                    stream.getTracks().forEach(track => pc.addTrack(track, stream));
                } catch (e) {
                    console.warn("No media devices found or permission denied");
                    // Fallback to data-only if media fails but wasn't strictly data-only
                }
            }

            await pc.setRemoteDescription(new RTCSessionDescription(state.incomingCaller.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socketService.emit('webrtc-answer', { to: targetUserId, answer });

            // Flush ICE candidates queued while waiting for user to accept
            while (iceCandidateQueue.current.length > 0) {
                const candidate = iceCandidateQueue.current.shift();
                if (candidate) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
            }
        } catch (err) {
            console.error("Answer failed:", err);
            endCall();
        }
    };

    const [fileQueue, setFileQueue] = useState<File[]>([]);
    const [isSending, setIsSending] = useState(false);

    // Monitor queue and send next file
    useEffect(() => {
        if (fileQueue.length > 0 && !isSending && state.callStatus === 'connected') {
            const nextFile = fileQueue[0];
            processFileSend(nextFile);
        }
    }, [fileQueue, isSending, state.callStatus]);

    const sendFiles = (files: File[]) => {
        setFileQueue(prev => [...prev, ...files]);
    };

    const processFileSend = (file: File) => {
        const channel = dataChannel.current;
        if (!channel || channel.readyState !== 'open') {
            toast.error("P2P Link Unstable");
            setFileQueue([]);
            return;
        }

        setIsSending(true);

        // 1. Send Metadata
        const meta: FileMeta = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            type: file.type
        };
        channel.send(JSON.stringify({ type: 'FILE_START', meta }));

        // 2. Read & Send Chunks
        const CHUNK_SIZE = 16 * 1024; // 16KB
        let offset = 0;
        const reader = new FileReader();

        reader.onload = (e) => {
            if (e.target?.result) {
                const buffer = e.target.result as ArrayBuffer;
                channel.send(buffer);
                offset += buffer.byteLength;

                setState(prev => ({ ...prev, fileProgress: Math.round((offset / file.size) * 100) }));

                if (offset < file.size) {
                    // Use timeout to prevent blocking UI thread too much
                    setTimeout(() => readSlice(offset), 0);
                } else {
                    channel.send(JSON.stringify({ type: 'FILE_END', id: meta.id }));
                    toast.success(`Sent: ${file.name}`);
                    setIsSending(false);
                    setState(prev => ({ ...prev, fileProgress: 0 }));
                    setFileQueue(prev => prev.slice(1)); // Remove sent file
                }
            }
        };

        const readSlice = (o: number) => {
            const slice = file.slice(o, o + CHUNK_SIZE);
            reader.readAsArrayBuffer(slice);
        };

        readSlice(0);
    };

    const endCall = () => {
        if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (state.localStream) {
            state.localStream.getTracks().forEach(track => track.stop());
        }
        setState(prev => ({
            ...prev,
            callStatus: 'idle',
            localStream: null,
            remoteStream: null,
            incomingCaller: null,
            remotePeerId: null,
            fileProgress: 0,
            incomingFile: null
        }));
    };

    const rejectCall = () => {
        // Implement rejection logic if needed, for now just end locally
        endCall();
    };

    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

    // Socket Event Listeners
    useEffect(() => {
        // Wrapper now handles initialization queuing
        const handleOffer = (data: { from: string, offer: RTCSessionDescriptionInit, isDataOnly?: boolean }) => {
            console.log("Incoming Offer:", data);

            // Sync ref for ICE
            remotePeerIdRef.current = data.from;

            setState(prev => {
                if (prev.callStatus !== 'idle') return prev;
                return {
                    ...prev,
                    callStatus: 'incoming',
                    incomingCaller: data,
                    remotePeerId: data.from,
                    isDataOnly: !!data.isDataOnly
                };
            });
        };

        const handleAnswer = async (data: { from: string, answer: RTCSessionDescriptionInit }) => {
            console.log("Incoming Answer:", data);
            if (peerConnection.current) {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setState(prev => ({ ...prev, callStatus: 'connected' }));

                // Flush any queued candidates that arrived before Answer
                while (iceCandidateQueue.current.length > 0) {
                    const candidate = iceCandidateQueue.current.shift();
                    if (candidate) {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                }
            }
        };

        const handleCandidate = async (data: { from: string, candidate: RTCIceCandidateInit }) => {
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                try {
                    await peerConnection.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error("Error adding received ice candidate", e);
                }
            } else {
                console.log("Queuing ICE candidate (PC not ready)");
                iceCandidateQueue.current.push(data.candidate);
            }
        };

        socketService.on('webrtc-offer', handleOffer);
        socketService.on('webrtc-answer', handleAnswer);
        socketService.on('webrtc-ice-candidate', handleCandidate);

        return () => {
            socketService.off('webrtc-offer');
            socketService.off('webrtc-answer');
            socketService.off('webrtc-ice-candidate');
        };
    }, []);

    return {
        ...state,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        sendFiles,
        lookupUser
    };
}
