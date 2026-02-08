import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface FilterCheckboxGroupProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  renderLabel?: (option: string) => React.ReactNode;
  maxHeight?: string;
}

export function FilterCheckboxGroup({
  label,
  options,
  selectedValues,
  onToggle,
  renderLabel,
  maxHeight,
}: FilterCheckboxGroupProps) {
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
