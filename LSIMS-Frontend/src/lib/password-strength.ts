export type PasswordStrengthLevel = "weak" | "medium" | "strong" | "very-strong";

export type PasswordStrengthChecks = {
  minLength: boolean;
  longLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
};

export type PasswordStrengthResult = {
  level: PasswordStrengthLevel;
  score: number;
  label: string;
  checks: PasswordStrengthChecks;
  unmetHints: string[];
};

const LEVEL_LABELS: Record<PasswordStrengthLevel, string> = {
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
  "very-strong": "Very strong",
};

function getChecks(password: string): PasswordStrengthChecks {
  return {
    minLength: password.length >= 8,
    longLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getUnmetHints(checks: PasswordStrengthChecks): string[] {
  const hints: string[] = [];

  if (!checks.minLength) hints.push("Use at least 8 characters");
  if (!checks.longLength) hints.push("Use 12 or more characters for extra strength");
  if (!checks.uppercase) hints.push("Add an uppercase letter");
  if (!checks.lowercase) hints.push("Add a lowercase letter");
  if (!checks.number) hints.push("Add a number");
  if (!checks.special) hints.push("Add a special character");

  return hints;
}

function scoreFromChecks(checks: PasswordStrengthChecks): number {
  let score = 0;
  if (checks.minLength) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;
  if (checks.longLength) score += 1;
  return score;
}

function levelFromScore(score: number): PasswordStrengthLevel {
  if (score >= 6) return "very-strong";
  if (score >= 5) return "strong";
  if (score >= 3) return "medium";
  return "weak";
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const checks = getChecks(password);
  const score = scoreFromChecks(checks);
  const level = levelFromScore(score);

  return {
    level,
    score,
    label: LEVEL_LABELS[level],
    checks,
    unmetHints: getUnmetHints(checks),
  };
}

export function getPasswordStrengthBarClass(level: PasswordStrengthLevel): string {
  switch (level) {
    case "weak":
      return "bg-destructive";
    case "medium":
      return "bg-amber-500";
    case "strong":
    case "very-strong":
      return "bg-green-600";
  }
}

export function getPasswordStrengthFillPercent(level: PasswordStrengthLevel): number {
  switch (level) {
    case "weak":
      return 25;
    case "medium":
      return 50;
    case "strong":
      return 75;
    case "very-strong":
      return 100;
  }
}
