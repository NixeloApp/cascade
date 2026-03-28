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
import { ChevronDown, SlidersHorizontal } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { Icon } from "../ui/Icon";
import { Inline } from "../ui/Inline";

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
        <Button
          variant="ghost"
          size="sm"
          data-testid={TEST_IDS.BOARD.DISPLAY_PROPERTIES_TRIGGER}
          className="text-ui-text-secondary"
          leftIcon={<Icon icon={SlidersHorizontal} size="sm" />}
          rightIcon={<Icon icon={ChevronDown} size="xs" tone="tertiary" />}
        >
          <Inline className="hidden sm:inline">
            {hasHidden ? `Properties (${visibleCount})` : "Properties"}
          </Inline>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" minWidth="sm">
        {properties.map((property) => (
          <DropdownMenuCheckboxItem
            key={property}
            data-testid={TEST_IDS.BOARD.DISPLAY_PROPERTIES_OPTION(property)}
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
