import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { switchLocaleInPathname } from "@/lib/i18n/localize-path";
import {
  LOCALE_OPTIONS,
  getLocaleOption,
  setPreferredLocale,
  type SupportedLocale,
} from "@/lib/i18n/locales";
import { useAuthLocale, usePublicLocale } from "@/providers/locale-provider";
import { cn } from "@/lib/ui";

function EnglandFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 36"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="36" fill="#fff" />
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#CE1124" strokeWidth="6" />
      <path d="M0 0 L60 36 M60 0 L0 36" stroke="#fff" strokeWidth="2" />
      <path d="M30 0 V36 M0 18 H60" stroke="#CE1124" strokeWidth="10" />
      <path d="M30 0 V36 M0 18 H60" stroke="#fff" strokeWidth="6" />
    </svg>
  );
}

function EthiopiaFlag({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 36"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="12" y="0" fill="#078930" />
      <rect width="60" height="12" y="12" fill="#FCDD09" />
      <rect width="60" height="12" y="24" fill="#DA121A" />
      <circle cx="30" cy="18" r="7" fill="#0F47AF" />
      <path
        d="M30 13 L32 17 L36 17 L33 19.5 L34.5 23.5 L30 21 L25.5 23.5 L27 19.5 L24 17 L28 17 Z"
        fill="#FCDD09"
      />
    </svg>
  );
}

const LOCALE_FLAGS: Record<SupportedLocale, React.ComponentType<{ className?: string }>> = {
  en: EnglandFlag,
  am: EthiopiaFlag,
};

type PublicLocaleSwitcherProps = {
  className?: string;
  compact?: boolean;
  mode?: "public" | "auth";
};

export function PublicLocaleSwitcher({
  className,
  compact = false,
  mode = "public",
}: PublicLocaleSwitcherProps) {
  const { locale } = usePublicLocale();
  const authLocale = useAuthLocale();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const currentOption = getLocaleOption(locale);
  const CurrentFlag = LOCALE_FLAGS[locale];

  React.useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  React.useEffect(() => {
    if (open) {
      const index = LOCALE_OPTIONS.findIndex((option) => option.code === locale);
      setHighlightedIndex(index >= 0 ? index : 0);
    }
  }, [locale, open]);

  const selectLocale = (nextLocale: SupportedLocale) => {
    setOpen(false);
    if (nextLocale === locale) return;

    setPreferredLocale(nextLocale);

    if (mode === "auth" && authLocale) {
      authLocale.setLocale(nextLocale);
      return;
    }

    navigate(switchLocaleInPathname(pathname, nextLocale));
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) => (index + 1) % LOCALE_OPTIONS.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex(
        (index) => (index - 1 + LOCALE_OPTIONS.length) % LOCALE_OPTIONS.length,
      );
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectLocale(LOCALE_OPTIONS[highlightedIndex].code);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon-sm" : "sm"}
        className={cn(
          "gap-1.5 px-2",
          compact && "size-9 shrink-0 px-0",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Language: ${currentOption.label}. Change language.`}
        onClick={() => setOpen((value) => !value)}
      >
        <CurrentFlag className="h-4 w-6 shrink-0 rounded-sm border border-border/60 object-cover" />
        {!compact ? (
          <>
            <span className="text-xs font-medium uppercase">{locale}</span>
            <ChevronDown
              className={cn(
                "size-3.5 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
              aria-hidden
            />
          </>
        ) : null}
      </Button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Select language"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {LOCALE_OPTIONS.map((option, index) => {
            const Flag = LOCALE_FLAGS[option.code];
            const isSelected = option.code === locale;
            const isHighlighted = index === highlightedIndex;

            return (
              <li key={option.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    isHighlighted && "bg-accent",
                    isSelected
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectLocale(option.code)}
                >
                  <Flag className="h-4 w-6 shrink-0 rounded-sm border border-border/60" />
                  <span>{option.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {option.nativeLabel}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
