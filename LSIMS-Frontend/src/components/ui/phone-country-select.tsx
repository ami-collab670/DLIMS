import { ChevronDown } from "lucide-react";
import * as React from "react";
import { getCountryCallingCode, type Country } from "react-phone-number-input";

import { Input } from "@/components/ui/input";
import { getPhoneCountryMeta } from "@/lib/validation";
import { cn } from "@/lib/ui";

type CountryOption = {
  value?: string;
  label: string;
  divider?: boolean;
};

type IconComponentProps = {
  country?: string;
  label: string;
  aspectRatio?: number;
};

type PhoneCountrySelectProps = {
  value?: string;
  onChange: (country?: string) => void;
  options: CountryOption[];
  disabled?: boolean;
  readOnly?: boolean;
  iconComponent?: React.ComponentType<IconComponentProps>;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
};

const PINNED_COUNTRY = "ET";

function getSelectedOption(options: CountryOption[], value?: string) {
  return options.find(
    (option) => !option.divider && option.value === (value ?? undefined),
  );
}

function sortCountryOptions(options: CountryOption[]) {
  const countries = options.filter((option) => !option.divider && option.value);
  const pinned = countries.find((option) => option.value === PINNED_COUNTRY);
  const rest = countries
    .filter((option) => option.value !== PINNED_COUNTRY)
    .sort((a, b) => a.label.localeCompare(b.label));

  return pinned ? [pinned, ...rest] : rest;
}

function PhoneCountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  iconComponent: Icon,
  onFocus,
  onBlur,
  className,
}: PhoneCountrySelectProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  const selectedOption = getSelectedOption(options, value);
  const selectedMeta = value ? getPhoneCountryMeta(value as Country) : null;
  const isDisabled = disabled || readOnly;

  const countryOptions = React.useMemo(
    () => sortCountryOptions(options),
    [options],
  );

  const filteredOptions = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return countryOptions;

    return countryOptions.filter((option) => {
      if (!option.value) return false;
      const meta = getPhoneCountryMeta(option.value as Country);
      return (
        option.label.toLowerCase().includes(query) ||
        option.value.toLowerCase().includes(query) ||
        meta.callingCode.includes(query.replace(/^\+/, ""))
      );
    });
  }, [countryOptions, search]);

  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [search, open]);

  React.useEffect(() => {
    if (!open) return;

    searchRef.current?.focus();

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function selectCountry(country?: string) {
    onChange(country);
    setOpen(false);
    setSearch("");
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (isDisabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
      onFocus?.();
    }
  }

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setSearch("");
      onBlur?.();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((index) =>
        Math.min(index + 1, Math.max(filteredOptions.length - 1, 0)),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === "Enter" && filteredOptions[highlightedIndex]?.value) {
      event.preventDefault();
      selectCountry(filteredOptions[highlightedIndex].value);
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("PhoneInputCountry phone-country-select", className)}
    >
      <button
        type="button"
        className="phone-country-select__trigger"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (isDisabled) return;
          setOpen((current) => !current);
          onFocus?.();
        }}
        onKeyDown={onTriggerKeyDown}
        onBlur={() => {
          if (!open) onBlur?.();
        }}
      >
        {Icon ? (
          <Icon
            country={value}
            label={selectedOption?.label ?? "International"}
          />
        ) : null}
        <span className="phone-country-select__name">
          {selectedMeta?.name ?? selectedOption?.label ?? "International"}
        </span>
        {selectedMeta ? (
          <span className="phone-country-select__code">
            (+{selectedMeta.callingCode})
          </span>
        ) : null}
        <ChevronDown className="phone-country-select__arrow" aria-hidden />
      </button>

      {open ? (
        <div className="phone-country-select__panel" role="listbox">
          <Input
            ref={searchRef}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={onSearchKeyDown}
            placeholder="Filter countries…"
            className="phone-country-select__search"
            aria-label="Filter countries"
          />
          <ul className="phone-country-select__list">
            {filteredOptions.length === 0 ? (
              <li className="phone-country-select__empty">No countries found.</li>
            ) : (
              filteredOptions.map((option, index) => {
                if (!option.value) return null;
                const meta = getPhoneCountryMeta(option.value as Country);
                const isSelected = option.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "phone-country-select__option",
                        isSelected && "phone-country-select__option--selected",
                        isHighlighted && "phone-country-select__option--highlighted",
                      )}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => selectCountry(option.value)}
                    >
                      {Icon ? (
                        <Icon country={option.value} label={option.label} />
                      ) : null}
                      <span className="phone-country-select__option-name">
                        {option.label}
                      </span>
                      <span className="phone-country-select__option-code">
                        (+{meta.callingCode || getCountryCallingCode(option.value as Country)})
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { PhoneCountrySelect };
