import type { ReactNode } from "react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

const selectWidthClasses = {
  full: "w-full",
  xs: "w-24",
  sm: "w-36",
  md: "w-48",
  lg: "w-56",
} as const;

type MockOption = {
  disabled?: boolean;
  label: string;
  testId?: string;
  value: string;
};

type MockGroup = {
  label?: string;
  options: MockOption[];
};

type MockSelectProps = {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  contentTestId?: string;
  defaultValue?: string;
  disabled?: boolean;
  groups?: MockGroup[];
  id?: string;
  onChange?: (value: string) => void;
  options?: MockOption[];
  placeholder?: string;
  renderOption?: (option: MockOption) => ReactNode;
  renderValue?: (option: MockOption) => ReactNode;
  testId?: string;
  value?: string;
  width?: keyof typeof selectWidthClasses;
};

function flattenOptions(groups?: MockGroup[], options?: MockOption[]) {
  if (groups && groups.length > 0) {
    return groups.flatMap((group) => group.options);
  }
  return options ?? [];
}

/** Test-only Select mock that supports wrapper props and simple option-button interactions. */
export function Select({
  ariaDescribedBy,
  ariaInvalid,
  ariaLabel,
  className,
  contentClassName,
  contentTestId,
  defaultValue,
  disabled,
  groups,
  id,
  onChange,
  options,
  placeholder,
  renderOption,
  renderValue,
  testId,
  value,
  width,
}: MockSelectProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const currentValue = isControlled ? (value ?? "") : internalValue;
  const flattenedOptions = flattenOptions(groups, options);
  const fallbackId = useId();
  const resolvedId = id ?? fallbackId;
  const selectedOption = flattenedOptions.find((option) => option.value === currentValue);
  const selectedLabel = selectedOption?.label ?? placeholder ?? "";
  const triggerClassName = cn(
    width ? selectWidthClasses[width] : selectWidthClasses.full,
    className,
  );

  const updateValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return (
    <div className="contents">
      <select
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={triggerClassName}
        data-testid={testId}
        disabled={disabled}
        id={resolvedId}
        value={currentValue}
        onChange={(event) => updateValue(event.target.value)}
      >
        {placeholder && (currentValue === "" || !selectedOption) ? (
          <option disabled value="">
            {placeholder}
          </option>
        ) : null}
        {groups && groups.length > 0
          ? groups.map((group) => (
              <optgroup
                key={group.label ?? group.options.map((option) => option.value).join("|")}
                label={group.label}
              >
                {group.options.map((option) => (
                  <option
                    key={option.value}
                    data-testid={option.testId}
                    disabled={option.disabled}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))
          : flattenedOptions.map((option) => (
              <option
                key={option.value}
                data-testid={option.testId}
                disabled={option.disabled}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
      </select>

      <div aria-hidden="true" className="sr-only">
        {selectedOption && renderValue ? renderValue(selectedOption) : selectedLabel}
      </div>

      <div className={contentClassName} data-testid={contentTestId}>
        {groups && groups.length > 0
          ? groups.map((group) => (
              <div key={group.label ?? group.options.map((option) => option.value).join("|")}>
                {group.label ? <div>{group.label}</div> : null}
                {group.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-testid={option.testId}
                    disabled={disabled || option.disabled}
                    onClick={() => updateValue(option.value)}
                  >
                    {renderOption ? renderOption(option) : option.label}
                  </button>
                ))}
              </div>
            ))
          : flattenedOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                data-testid={option.testId}
                disabled={disabled || option.disabled}
                onClick={() => updateValue(option.value)}
              >
                {renderOption ? renderOption(option) : option.label}
              </button>
            ))}
      </div>
    </div>
  );
}
