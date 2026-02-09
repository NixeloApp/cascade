import { cn } from "@/lib/utils";
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
    <div>
      <Typography variant="label" className="block text-sm font-medium mb-2">
        {label}
      </Typography>
      <div className={cn("space-y-2", maxHeight)}>
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => onToggle(option)}
              className="rounded"
            />
            <Typography variant="p" className="text-sm capitalize">
              {renderLabel ? renderLabel(option) : option}
            </Typography>
          </label>
        ))}
      </div>
    </div>
  );
}
