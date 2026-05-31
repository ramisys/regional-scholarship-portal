import { Check } from "lucide-react";

import { cn } from "../../utils/cn";

interface ProgressStep {
  label: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep: number;
}

export const ProgressIndicator = ({ steps, currentStep }: ProgressIndicatorProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2",
                    isCompleted && "bg-green-500 border-green-500 text-white",
                    isCurrent && "bg-blue-500 border-blue-500 text-white",
                    !isCompleted && !isCurrent && "border-gray-300 text-gray-400",
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
                </div>
                <span className="mt-2 text-sm font-medium text-gray-700">{step.label}</span>
                {step.description && (
                  <span className="text-xs text-gray-500">{step.description}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    index < currentStep ? "bg-green-500" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
