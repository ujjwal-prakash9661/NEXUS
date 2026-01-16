
import React, { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RegistrationStepsProps {
    currentStep: number; // 0 to 4
    steps: string[];
}

const RegistrationSteps: React.FC<RegistrationStepsProps> = ({ currentStep, steps }) => {
    return (
        <div className="w-full max-w-xs mx-auto mt-6 space-y-3">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div
                        key={index}
                        className={cn(
                            "flex items-center space-x-3 text-sm transition-all duration-300",
                            isCurrent ? "text-emerald-400 scale-105 font-medium" :
                                isCompleted ? "text-emerald-600/70" : "text-slate-600"
                        )}
                    >
                        {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                        ) : (
                            <Circle className={cn("w-5 h-5", isCurrent && "animate-pulse")} />
                        )}
                        <span>{step}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default RegistrationSteps;
