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

export function FilterCheckboxGroup<T extends string>({
  label,
  options,
  selectedValues,
  onToggle,
  renderLabel,
  maxHeight,
}: FilterCheckboxGroupProps<T>) {
  return (
    <Stack gap="sm">
      <Typography variant="label">{label}</Typography>
      <Stack gap="sm" className={cn(maxHeight)}>
        {options.map((option) => (
          <Flex as="label" key={option} align="center" gap="sm" className="cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded"
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
