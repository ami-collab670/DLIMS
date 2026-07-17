import * as React from "react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import PhoneInputWithCountry, {
  type Country,
} from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import en from "react-phone-number-input/locale/en.json";
import "react-phone-number-input/style.css";

import { PhoneCountrySelect } from "@/components/ui/phone-country-select";
import { Input } from "@/components/ui/input";
import { normalizePhoneValue } from "@/lib/phone-normalize";
import { cn } from "@/lib/utils";

const PhoneInputControl = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input ref={ref} type="tel" autoComplete="tel" className={className} {...props} />
));

PhoneInputControl.displayName = "PhoneInputControl";

type PhoneInputProps = {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  defaultCountry?: Country;
  "aria-invalid"?: boolean;
};

function PhoneInput({
  value,
  onChange,
  onBlur,
  id,
  disabled,
  className,
  defaultCountry = "ET",
  "aria-invalid": ariaInvalid,
}: PhoneInputProps) {
  const [country, setCountry] = React.useState<Country | undefined>(
    defaultCountry,
  );

  React.useEffect(() => {
    setCountry(defaultCountry);
  }, [defaultCountry]);

  function handleChange(next?: string) {
    onChange(next ?? "");
  }

  function handleBlur() {
    const normalized = normalizePhoneValue(value ?? "", country ?? defaultCountry);
    if (normalized !== (value ?? "")) {
      onChange(normalized);
    }
    onBlur?.();
  }

  return (
    <div className="space-y-1.5">
      <PhoneInputWithCountry
        id={id}
        international
        countryCallingCodeEditable
        smartCaret
        limitMaxLength
        defaultCountry={defaultCountry}
        flags={flags}
        labels={en}
        countrySelectComponent={PhoneCountrySelect}
        value={value || undefined}
        onChange={handleChange}
        onBlur={handleBlur}
        onCountryChange={setCountry}
        disabled={disabled}
        className={cn("phone-input", className)}
        inputComponent={PhoneInputControl}
        numberInputProps={{ "aria-invalid": ariaInvalid }}
      />
      {country === "ET" ? (
        <p className="text-xs text-muted-foreground">
          Enter mobile number starting with 9 (e.g. 911234567). Leading 0 is
          converted automatically.
        </p>
      ) : null}
    </div>
  );
}

type PhoneInputFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  id?: string;
  disabled?: boolean;
  className?: string;
  defaultCountry?: Country;
};

function PhoneInputField<T extends FieldValues>({
  control,
  name,
  id,
  disabled,
  className,
  defaultCountry,
}: PhoneInputFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PhoneInput
          id={id}
          value={field.value ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={disabled}
          className={className}
          defaultCountry={defaultCountry}
          aria-invalid={fieldState.invalid}
        />
      )}
    />
  );
}

export { PhoneInput, PhoneInputField };
