import { useMemo } from "react";

import {
  checkPasswordStrength,
  getPasswordStrengthBarClass,
  getPasswordStrengthFillPercent,
} from "@/lib/validation";
import { cn } from "@/lib/ui";

type PasswordStrengthIndicatorProps = {
  password: string;
  className?: string;
};

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => checkPasswordStrength(password), [password]);

  if (password.length === 0) {
    return null;
  }

  const showHints =
    strength.level !== "strong" && strength.level !== "very-strong";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={getPasswordStrengthFillPercent(strength.level)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Password strength: ${strength.label}`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-200",
              getPasswordStrengthBarClass(strength.level),
            )}
            style={{ width: `${getPasswordStrengthFillPercent(strength.level)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium text-muted-foreground">
          {strength.label}
        </span>
      </div>

      {showHints && strength.unmetHints.length > 0 ? (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
          {strength.unmetHints.map((hint) => (
            <li key={hint}>{hint}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
