import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const EMPTY_OPTION_VALUE = "__nixelo-empty-select-value__";

const selectTriggerVariants = cva(
  "flex items-center justify-between rounded-md border text-sm text-ui-text ring-offset-ui-bg transition-colors duration-default placeholder:text-ui-text-tertiary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  {
    variants: {
      variant: {
        default: "h-10 border-ui-border bg-transparent px-3 py-2",
        inlineEdit:
          "h-8 border-transparent bg-transparent px-2 py-1 hover:bg-ui-bg-hover hover:border-ui-border focus:bg-ui-bg focus:border-ui-border",
      },
      width: {
        full: "w-full",
        xs: "w-24",
        sm: "w-36",
        md: "w-48",
        lg: "w-56",
      },
    },
    defaultVariants: {
      variant: "default",
      width: "full",
    },
  },
);

export interface SelectOption<TValue extends string = string> {
  disabled?: boolean;
  label: string;
  testId?: string;
  value: TValue;
}

export interface SelectOptionGroup<
  TValue extends string = string,
  TOption extends SelectOption<TValue> = SelectOption<TValue>,
> {
  label?: string;
  options: readonly TOption[];
}

export interface SelectProps<
  TValue extends string = string,
  TOption extends SelectOption<TValue> = SelectOption<TValue>,
> extends VariantProps<typeof selectTriggerVariants> {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  contentTestId?: string;
  defaultValue?: string;
  disabled?: boolean;
  groups?: readonly SelectOptionGroup<TValue, TOption>[];
  id?: string;
  onChange?: (value: TValue) => void;
  options?: readonly TOption[];
  placeholder?: string;
  renderOption?: (option: TOption) => React.ReactNode;
  renderValue?: (option: TOption) => React.ReactNode;
  testId?: string;
  value?: string;
}

function encodeOptionValue(value: string): string {
  return value === "" ? EMPTY_OPTION_VALUE : value;
}

function decodeOptionValue<TValue extends string>(value: string): TValue {
  return (value === EMPTY_OPTION_VALUE ? "" : value) as TValue;
}

function flattenGroups<TValue extends string, TOption extends SelectOption<TValue>>(
  groups: readonly SelectOptionGroup<TValue, TOption>[],
): TOption[] {
  return groups.flatMap((group) => [...group.options]);
}

function renderGroups<TValue extends string, TOption extends SelectOption<TValue>>({
  groups,
  renderOption,
}: {
  groups: readonly SelectOptionGroup<TValue, TOption>[];
  renderOption?: (option: TOption) => React.ReactNode;
}) {
  return groups.map((group, groupIndex) => (
    <React.Fragment
      key={`${group.label ?? "group"}-${group.options.map((option) => option.value).join("|")}`}
    >
      <SelectPrimitive.Group>
        {group.label ? (
          <SelectPrimitive.Label className="py-1.5 pl-8 pr-2 text-sm font-semibold text-ui-text-secondary">
            {group.label}
          </SelectPrimitive.Label>
        ) : null}
        {group.options.map((option) => (
          <SelectPrimitive.Item
            key={option.value}
            className={cn(
              "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-ui-text outline-none transition-colors duration-fast hover:bg-ui-bg-hover focus:bg-ui-bg-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            )}
            data-testid={option.testId}
            disabled={option.disabled}
            textValue={option.label}
            value={encodeOptionValue(option.value)}
          >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
              <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4 text-brand" />
              </SelectPrimitive.ItemIndicator>
            </span>
            {renderOption ? (
              renderOption(option)
            ) : (
              <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
            )}
          </SelectPrimitive.Item>
        ))}
      </SelectPrimitive.Group>
      {groupIndex < groups.length - 1 ? (
        <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-ui-border" />
      ) : null}
    </React.Fragment>
  ));
}

export function Select<
  TValue extends string = string,
  TOption extends SelectOption<TValue> = SelectOption<TValue>,
>({
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
  variant,
  width,
}: SelectProps<TValue, TOption>) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
  const currentValue = isControlled ? value : internalValue;
  const optionGroups =
    groups ?? (options ? [{ options } satisfies SelectOptionGroup<TValue, TOption>] : []);
  const flattenedOptions = flattenGroups(optionGroups);
  const selectedOption = flattenedOptions.find((option) => option.value === currentValue);
  const selectedValueContent =
    selectedOption && renderValue
      ? renderValue(selectedOption)
      : isControlled && selectedOption
        ? selectedOption.label
        : undefined;

  const handleValueChange = (nextValue: string) => {
    const decodedValue = decodeOptionValue<TValue>(nextValue);
    if (!isControlled) {
      setInternalValue(decodedValue);
    }
    onChange?.(decodedValue);
  };

  return (
    <SelectPrimitive.Root
      defaultValue={
        isControlled || defaultValue === undefined ? undefined : encodeOptionValue(defaultValue)
      }
      disabled={disabled}
      onValueChange={handleValueChange}
      value={isControlled ? encodeOptionValue(value) : undefined}
    >
      <SelectPrimitive.Trigger
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        className={cn(selectTriggerVariants({ variant, width }), className)}
        data-testid={testId}
        id={id}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedValueContent}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 text-ui-text-secondary" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-ui-border bg-ui-bg-elevated text-ui-text shadow-elevated data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
            contentClassName,
          )}
          data-testid={contentTestId}
          position="popper"
        >
          <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
            <ChevronUp className="h-4 w-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-1">
            {renderGroups({ groups: optionGroups, renderOption })}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
            <ChevronDown className="h-4 w-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
