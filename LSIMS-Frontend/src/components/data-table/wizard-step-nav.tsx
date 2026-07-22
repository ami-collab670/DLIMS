import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui";

type WizardStepNavProps = {
  steps: readonly string[];
  step: number;
  onStepChange: (index: number) => void;
  onNext?: () => void;
  onBack?: () => void;
  canProceedNext?: boolean;
  showArrows?: boolean;
  className?: string;
};

export function WizardStepNav({
  steps,
  step,
  onStepChange,
  onNext,
  onBack,
  canProceedNext = true,
  showArrows = true,
  className,
}: WizardStepNavProps) {
  const atFirst = step <= 0;
  const atLast = step >= steps.length - 1;

  return (
    <div className={cn("mt-3", className)}>
      <ol className="flex flex-wrap items-center gap-2" aria-label="Steps">
        {steps.map((label, i) => {
          const isCurrent = i === step;
          const isComplete = i < step;
          return (
            <li key={label}>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  isCurrent
                    ? "border-primary bg-primary/10 font-medium text-primary"
                    : isComplete
                      ? "border-border bg-muted/40 text-foreground hover:bg-muted/60"
                      : "border-dashed border-border text-muted-foreground hover:border-primary/40",
                )}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onStepChange(i)}
              >
                {i + 1}. {label}
              </button>
            </li>
          );
        })}
        {showArrows ? (
          <li className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 shrink-0"
              disabled={atFirst}
              aria-label="Previous step"
              onClick={() => {
                if (onBack) onBack();
                else if (!atFirst) onStepChange(step - 1);
              }}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {!atLast ? (
              <Button
                type="button"
                size="icon"
                className="size-8 shrink-0"
                aria-label="Next step"
                disabled={!canProceedNext}
                onClick={() => {
                  if (onNext) onNext();
                }}
              >
                <ChevronRight className="size-4" />
              </Button>
            ) : null}
          </li>
        ) : null}
      </ol>
    </div>
  );
}
