import { cn } from "@/lib/utils";
import { Card, getCardRecipeClassName } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
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
    <Card recipe="commandSection" padding="md">
      <Stack gap="sm">
        <Typography variant="label" className="uppercase tracking-wider text-ui-text-tertiary">
          {label}
        </Typography>
        <Stack gap="sm" className={cn(maxHeight)}>
          {options.map((option) => {
            const isSelected = selectedValues.includes(option);

            return (
              <div
                key={option}
                className={cn(
                  getCardRecipeClassName(isSelected ? "selectionRowSelected" : "selectionRow"),
                  "p-3",
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(option)}
                  label={
                    <Typography variant="small" className="capitalize">
                      {renderLabel ? (
                        <Flex as="span" align="center" gap="xs">
                          {renderLabel(option)}
                        </Flex>
                      ) : (
                        option
                      )}
                    </Typography>
                  }
                />
              </div>
            );
          })}
        </Stack>
      </Stack>
    </Card>
  );
}
