import { cn } from "@/lib/utils";
import { Flex } from "../ui/Flex";
import { Stack } from "../ui/Stack";
import { Typography } from "../ui/Typography";

interface FilterCheckboxGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  selectedValues: string[];
  onToggle: (value: T) => void;
  renderLabel?: (option: T) => React.ReactNode;
  maxHeight?: string;
}

/**
 * Reusable checkbox group for filtering (type, priority, status, etc.).
 */
export function FilterCheckboxGroup<T extends string>({
  label,
  options,
  selectedValues,
  onToggle,
  renderLabel,
  maxHeight,
}: FilterCheckboxGroupProps<T>) {
  return (
    <Stack
      gap="sm"
      className="rounded-2xl border border-ui-border-secondary/70 bg-ui-bg-soft/70 p-4 shadow-soft"
    >
      <Typography variant="label" className="uppercase tracking-wider text-ui-text-tertiary">
        {label}
      </Typography>
      <Stack gap="sm" className={cn(maxHeight)}>
        {options.map((option) => (
          <Flex
            as="label"
            key={option}
            align="center"
            gap="sm"
            className="cursor-pointer rounded-xl border border-transparent px-2 py-1.5 transition-default hover:border-ui-border hover:bg-ui-bg-elevated/80"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded border-ui-border-secondary text-brand focus:ring-brand-ring"
            />
            <Typography variant="small" className="capitalize">
              {renderLabel ? renderLabel(option) : option}
            </Typography>
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
