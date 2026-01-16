
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
    const { loginDemo } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleDemoLogin = async () => {
        setIsLoading(true);
        try {
            await loginDemo();
            toast({
                title: "Authentication Verified",
                description: "Access granted to Nexus Environment.",
                className: "border-primary/50 text-foreground bg-black"
            });
            navigate("/");
        } catch (error) {
            toast({
                title: "Access Denied",
                description: "Could not establish secure connection.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-[0.03] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

            <Card className="w-[400px] bg-card/40 backdrop-blur-xl border-primary/20 shadow-[0_0_50px_-10px_hsl(var(--primary)/0.15)] relative z-10">
                <CardHeader className="text-center space-y-4 pb-2">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)] mb-2 group cursor-default">
                        <div className="w-10 h-10 border-2 border-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <CardTitle className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-primary bg-300% animate-shimmer">
                            NEXUS
                        </CardTitle>
                        <CardDescription className="text-primary/70 font-medium tracking-wide text-xs uppercase">
                            Bio-Secured Ecosystem
                        </CardDescription>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="grid gap-6">
                        <Button
                            onClick={handleDemoLogin}
                            disabled={isLoading}
                            className="w-full h-12 bg-primary/10 hover:bg-primary/20 border border-primary/50 text-primary font-display tracking-wider transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        Authenticating...
                                    </>
                                ) : (
                                    <>
                                        Initialize System
                                        <span className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">→</span>
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </Button>

                        <p className="text-center text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                            Restricted Access • Level 5 Clearance Required
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Login;
