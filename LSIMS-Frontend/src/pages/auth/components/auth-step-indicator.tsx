import { cn } from "@/lib/ui/cn";

export function AuthStepIndicator({
  activeStep,
}: {
  activeStep: "request" | "confirm";
}) {
  const steps = [
    { id: "request" as const, label: "Email" },
    { id: "confirm" as const, label: "Reset code" },
  ];

  return (
    <ol
      className="flex items-center gap-2"
      aria-label="Password reset progress"
    >
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isComplete =
          activeStep === "confirm" && step.id === "request";

        return (
          <li key={step.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span
                className="h-px w-6 bg-border sm:w-10"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                isActive || isComplete
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isActive || isComplete
                    ? "bg-primary-foreground/20"
                    : "bg-background",
                )}
              >
                {index + 1}
              </span>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
