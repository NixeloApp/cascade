/**
 * DisplayPropertiesSelector - Dropdown for toggling card display properties
 *
 * Allows users to show/hide various properties on issue cards:
 * - Issue Type icon
 * - Priority icon
 * - Labels
 * - Assignee avatar
 * - Story Points
 */

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  CARD_DISPLAY_LABELS,
  type CardDisplayOptions,
  type CardDisplayProperty,
  countVisibleProperties,
  getCardDisplayProperties,
  hasHiddenProperties,
  showAllProperties,
  toggleProperty,
} from "@/lib/card-display-utils";

interface DisplayPropertiesSelectorProps {
  value: CardDisplayOptions;
  onChange: (value: CardDisplayOptions) => void;
}

export function DisplayPropertiesSelector({ value, onChange }: DisplayPropertiesSelectorProps) {
  const properties = getCardDisplayProperties();
  const visibleCount = countVisibleProperties(value);
  const hasHidden = hasHiddenProperties(value);

  const handleToggle = (property: CardDisplayProperty) => {
    onChange(toggleProperty(value, property));
  };

  const handleShowAll = () => {
    onChange(showAllProperties());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-ui-text-secondary">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">
            {hasHidden ? `Properties (${visibleCount})` : "Properties"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {properties.map((property) => (
          <DropdownMenuCheckboxItem
            key={property}
            checked={value[property]}
            onCheckedChange={() => handleToggle(property)}
          >
            {CARD_DISPLAY_LABELS[property]}
          </DropdownMenuCheckboxItem>
        ))}
        {hasHidden && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={handleShowAll}>
              Show All
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
