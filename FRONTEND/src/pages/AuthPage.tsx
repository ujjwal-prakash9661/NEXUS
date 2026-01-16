
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, LogIn, UserPlus, Github } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import FaceCamera from "@/components/auth/FaceCamera";
import RegistrationSteps from "@/components/auth/RegistrationSteps";
import { cn } from "@/lib/utils";
import { loadModels, detectFace } from "@/lib/face.service";
import { API_BASE_URL } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

const REGISTER_STEPS = [
    "Face Detection",
    "Liveness Check",
    "Secure Encoding",
    "Creating Account"
];

interface AuthPageProps {
    defaultTab?: "login" | "register";
}

const AuthPage: React.FC<AuthPageProps> = ({ defaultTab = "login" }) => {
    const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    const { loginDemo } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { setToken, setUser } = useAuth(); // Need to use these directly or update loginDemo to handle input
    const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

    React.useEffect(() => {
        loadModels();
    }, []);

    const toggleTab = (tab: "login" | "register") => {
        setActiveTab(tab);
        // Camera stays active
        setIsScanning(false);
        setCurrentStep(0);
        setIsProcessing(false);
    };

    const handleFaceAuth = async () => {
        if (!videoRef) {
            toast({ variant: "destructive", title: "Camera Error", description: "Camera not initialized" });
            return;
        }

        setIsScanning(true);

        try {
            // DETECT FACE
            const descriptor = await detectFace(videoRef);
            if (!descriptor) {
                toast({ variant: "destructive", title: "No Face Detected", description: "Please look at the camera" });
                setIsScanning(false);
                return;
            }

            const descriptorArray = Array.from(descriptor); // Convert Float32Array to regular array for JSON

            if (activeTab === "login") {
                setIsProcessing(true);

                const response = await fetch(`${API_BASE_URL}/auth/face-login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ descriptor: descriptorArray }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Login failed");
                }

                if (data.token) {
                    setToken(data.token);
                    localStorage.setItem("nexus_token", data.token);
                    if (data.user) {
                        // Ensure status is approved before logging in fully
                        const userObj = { ...data.user, status: 'APPROVED' };
                        setUser(userObj);
                        localStorage.setItem("nexus_user", JSON.stringify(userObj));
                    }
                    toast({ title: "Welcome back!", description: `Authenticated as ${data.user?.name || 'User'}` });
                    navigate("/");
                }

            } else {
                // REGISTER FLOW
                setIsProcessing(true);

                // Simulate steps quickly for UX, but actually just do the registration
                // We'll advance steps visually while calling the API

                const steps = async () => {
                    setCurrentStep(1); // Face Detected
                    await new Promise(r => setTimeout(r, 500));
                    setCurrentStep(2); // Liveness (Simulated)
                    await new Promise(r => setTimeout(r, 500));
                    setCurrentStep(3); // Encoding (Done)

                    // Call Register API
                    // For demo, we use a fake email/name if not provided. 
                    // In a real app, we'd ask for these details first or generated them.
                    // Let's generate a random one for this "Face Only" flow or prompt user.
                    // As per user request "register process ... login directly", we'll just create a user.
                    const randomId = Math.floor(Math.random() * 10000);
                    const email = `faceuser${randomId}@nexus.sys`;
                    const name = `Nexus User ${randomId}`;

                    const response = await fetch(`${API_BASE_URL}/auth/face-register`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email,
                            name,
                            descriptor: descriptorArray
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || "Registration failed");
                    }

                    setCurrentStep(4); // Account Created
                    await new Promise(r => setTimeout(r, 500));

                    if (data.token) {
                        setToken(data.token);
                        localStorage.setItem("nexus_token", data.token);
                        if (data.user) {
                            setUser(data.user);
                            localStorage.setItem("nexus_user", JSON.stringify(data.user));
                        }
                        toast({ title: "Registration Complete", description: "Face ID registered successfully." });
                        navigate("/");
                    }
                };

                await steps();
            }

        } catch (e: any) {
            console.error(e);
            toast({ variant: "destructive", title: "Authentication Failed", description: e.message });
        } finally {
            setIsScanning(false);
            setIsProcessing(false);
        }
    };

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                setIsProcessing(true);
                toast({ title: "Verifying Google", description: "Completing authentication..." });

                const response = await fetch(`${API_BASE_URL}/auth/google`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token })
                });

                const data = await response.json();

                if (!response.ok) throw new Error(data.message || "Google Login Failed");

                if (data.token) {
                    setToken(data.token);
                    localStorage.setItem("nexus_token", data.token);
                    if (data.user) {
                        const userObj = { ...data.user, status: 'APPROVED' };
                        setUser(userObj);
                        localStorage.setItem("nexus_user", JSON.stringify(userObj));
                    }
                    toast({ title: "Welcome back!", description: `Authenticated as ${data.user?.name || 'User'}` });
                    navigate("/");
                }
            } catch (e: any) {
                console.error(e);
                toast({ variant: "destructive", title: "Google Auth Failed", description: e.message });
            } finally {
                setIsProcessing(false);
            }
        },
        onError: () => {
            toast({ variant: "destructive", title: "Google Auth Failed", description: "Popup closed or error occurred." });
        }
    });

    const handleGoogleAuth = () => {
        loginWithGoogle();
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.03] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">

                {/* Header Logo */}
                <div className="flex flex-col items-center mb-8 space-y-2">
                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-[0_0_20px_hsl(var(--primary)/0.2)]">
                        <div className="w-8 h-8 rounded-lg border-2 border-primary flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary animate-shimmer bg-300%">
                        NEXUS
                    </h1>
                    <p className="text-primary/70 text-xs uppercase tracking-widest font-medium">Bio-Secured Ecosystem</p>
                </div>

                {/* Main Card */}
                <Card className="w-full max-w-md bg-card/40 backdrop-blur-xl border-primary/20 shadow-[0_0_50px_-10px_hsl(var(--primary)/0.15)] overflow-hidden relative">
                    <div className="p-6">

                        {/* Tabs */}
                        <div className="flex bg-secondary/50 rounded-lg p-1 mb-8 border border-primary/10">
                            <button
                                onClick={() => toggleTab("login")}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                                    activeTab === "login"
                                        ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                )}
                            >
                                <LogIn className="w-4 h-4 mr-2" /> Login
                            </button>
                            <button
                                onClick={() => toggleTab("register")}
                                className={cn(
                                    "flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all",
                                    activeTab === "register"
                                        ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
                                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                )}
                            >
                                <UserPlus className="w-4 h-4 mr-2" /> Register
                            </button>
                        </div>

                        {/* Camera Section */}
                        <div className="flex flex-col items-center py-4 min-h-[300px]">
                            <FaceCamera
                                isActive={isCameraActive}
                                isScanning={isScanning || (activeTab === "register" && isProcessing)}
                                mode={activeTab}
                                className="mb-6 scale-90 sm:scale-100 transition-transform border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
                                onVideoRef={setVideoRef}
                            />

                            {activeTab === "register" && isScanning && (
                                <RegistrationSteps currentStep={currentStep} steps={REGISTER_STEPS} />
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-4 mt-6">
                            {!isScanning && !isProcessing ? (
                                <Button
                                    onClick={handleFaceAuth}
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-background font-display font-bold tracking-wider text-lg shadow-[0_0_20px_hsl(var(--primary)/0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
                                >
                                    {activeTab === "login" ? "INITIALIZE LOGIN" : "INITIALIZE REGISTRATION"}
                                </Button>
                            ) : (
                                <div className="text-center text-sm text-primary/70 h-12 flex items-center justify-center animate-pulse">
                                    {activeTab === "login" ? "VERIFYING BIOMETRICS..." : "PROCESSING ENOLLMENT..."}
                                </div>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-primary/10" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                                    <span className="bg-[#111827] px-2 text-muted-foreground">Or Authenticate With</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleGoogleAuth}
                                className="w-full h-12 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary/80 hover:text-primary transition-all hover:border-primary/40 group"
                            >
                                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="currentColor"
                                    />
                                </svg>
                                Google Access
                            </Button>
                        </div>

                        <div className="mt-8 text-center">
                            <p className="text-[10px] text-primary/40 uppercase tracking-widest">
                                By continuing, you accept the <a href="#" className="underline hover:text-primary transition-colors">Neural Protocols</a>
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Wrap with Provider
const AuthPageWithProvider = (props: AuthPageProps) => {
    return (
        <GoogleOAuthProvider clientId="358845697770-b3m37rhto822esh1sa2asg0iqgav5g3u.apps.googleusercontent.com">
            <AuthPage {...props} />
        </GoogleOAuthProvider>
    );
};

export default AuthPageWithProvider;
