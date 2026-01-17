
import React, { useState, useEffect } from "react";
import { Shield, CheckCircle, XCircle, Camera, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { API_BASE_URL, useAuth } from "@/contexts/AuthContext";
import FaceCamera from "@/components/auth/FaceCamera";
import { loadModels, detectFace } from "@/lib/face.service";
import { Link } from "react-router-dom";

const SecuritySettings = () => {
    const { token, user } = useAuth();
    const { toast } = useToast();
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [verifyStatus, setVerifyStatus] = useState<"idle" | "success" | "failure">("idle");

    useEffect(() => {
        loadModels();
    }, []);

    const handleAction = async (action: "enroll" | "verify" | "presence") => {
        if (!videoRef) return;

        setIsScanning(true);
        setVerifyStatus("idle");

        try {
            const descriptor = await detectFace(videoRef);
            if (!descriptor) {
                toast({ variant: "destructive", title: "No Face Detected" });
                setIsScanning(false);
                return;
            }

            const descriptorArray = Array.from(descriptor);
            let endpoint = "";
            let successTitle = "";
            let successDesc = "";

            if (action === "enroll") {
                endpoint = "/vault/face-enroll";
                successTitle = "Face Enrolled";
                successDesc = "Your face data has been securely saved.";
            } else if (action === "verify") {
                endpoint = "/vault/face-verify";
                successTitle = "Verification Successful";
                successDesc = "Identity confirmed.";
            } else if (action === "presence") {
                endpoint = "/vault/presence-check";
                successTitle = "Presence Active";
                successDesc = "System is monitoring your presence.";
            }

            // Vault endpoints require wrapping descriptors usually, but let's check input format
            // controller: enrollFace -> { descriptors: [desc] } (it expects array of descriptors? NO, it expects body.descriptors)
            // Controller code: const { descriptors } = req.body. And then req.user.faceDescriptors = descriptors.
            // It seems it replaces ALL descriptors.

            // Wait, controller source: 
            // exports.enrollFace = async (req, res) => { const { descriptors } = req.body ... req.user.faceDescriptors = descriptors ... } 
            // exports.verifyFace = async (req, res) => { const { descriptor } = req.body ... }

            let body: any = {};
            if (action === "enroll") {
                // For simplify, we send just this one descriptor as a list of 1
                body = { descriptors: [descriptorArray] };
            } else {
                body = { descriptor: descriptorArray };
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Request failed");
            }

            if (action === "verify" || action === "presence") {
                // Check specific response logic
                // verifyFace returns { match: true/false }
                // presenceCheck returns { status: 'ACTIVE'/'LOCKED' }

                if (action === "verify" && !data.match) {
                    throw new Error(" Face does not match registered user.");
                }
            }

            setVerifyStatus("success");
            toast({ title: successTitle, description: successDesc });

        } catch (e: any) {
            setVerifyStatus("failure");
            toast({ variant: "destructive", title: "Action Failed", description: e.message });
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-white p-4 md:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                        <Shield className="text-emerald-500 w-6 h-6 md:w-8 md:h-8" />
                        Security Settings
                    </h1>
                    <Link to="/" className="w-full sm:w-auto">
                        <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="bg-[#111827] border-slate-800">
                        <CardHeader>
                            <CardTitle>Biometric Access</CardTitle>
                            <CardDescription>Manage your face authentication data.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center gap-6">
                            <FaceCamera
                                isActive={true}
                                isScanning={isScanning}
                                onVideoRef={setVideoRef}
                                className="scale-90"
                            />

                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Button
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 w-full"
                                    onClick={() => handleAction("enroll")}
                                    disabled={isScanning}
                                >
                                    <Camera className="w-4 h-4 mr-2" /> Enroll/Update Face
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 w-full"
                                    onClick={() => handleAction("verify")}
                                    disabled={isScanning}
                                >
                                    <Shield className="w-4 h-4 mr-2" /> Test Verify
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111827] border-slate-800">
                        <CardHeader>
                            <CardTitle>Verification Status</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center h-64">
                            {verifyStatus === "idle" && (
                                <div className="text-slate-500 flex flex-col items-center">
                                    <Lock className="w-12 h-12 mb-2 opacity-50" />
                                    <p>Ready to verify</p>
                                </div>
                            )}
                            {verifyStatus === "success" && (
                                <div className="text-emerald-500 flex flex-col items-center animate-in zoom-in">
                                    <CheckCircle className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold">Verified</h3>
                                    <p className="text-emerald-400/80">Face matches stored data.</p>
                                </div>
                            )}
                            {verifyStatus === "failure" && (
                                <div className="text-red-500 flex flex-col items-center animate-in zoom-in">
                                    <XCircle className="w-16 h-16 mb-4" />
                                    <h3 className="text-xl font-bold">Failed</h3>
                                    <p className="text-red-400/80">Verification failed.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;
