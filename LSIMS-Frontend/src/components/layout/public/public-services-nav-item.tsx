import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/ui";

type PublicServicesNavItemProps = {
  label: string;
  isActive: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onMouseEnterIndicator: () => void;
};

export const PublicServicesNavItem = forwardRef<
  HTMLButtonElement,
  PublicServicesNavItemProps
>(function PublicServicesNavItem(
  { label, isActive, isOpen, onOpen, onToggle, onMouseEnterIndicator },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={isOpen}
      aria-haspopup="true"
      onMouseEnter={() => {
        onOpen();
        onMouseEnterIndicator();
      }}
      onFocus={() => {
        onOpen();
        onMouseEnterIndicator();
      }}
      onClick={onToggle}
      className={cn(
        "relative z-10 inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive || isOpen
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown
        className={cn(
          "size-4 transition-transform duration-200",
          isOpen && "rotate-180",
        )}
        aria-hidden
      />
    </button>
  );
});
