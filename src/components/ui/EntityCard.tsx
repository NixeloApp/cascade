import type { ReactNode } from "react";
import { Button } from "./Button";
import { Card, CardBody, CardHeader } from "./Card";
import { Flex } from "./Flex";

interface EntityCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  actions?: ReactNode;
  badge?: ReactNode;
}

/**
 * Reusable card component for displaying entities in Manager components
 * Provides consistent layout and action buttons
 */
export function EntityCard({
  title,
  description,
  children,
  onEdit,
  onDelete,
  actions,
  badge,
}: EntityCardProps) {
  const defaultActions = (
    <Flex gap="sm">
      {onEdit && (
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      )}
      {onDelete && (
        <Button variant="danger" size="sm" onClick={onDelete}>
          Delete
        </Button>
      )}
    </Flex>
  );

  return (
    <Card>
      <CardHeader
        title={title}
        badge={badge}
        description={description}
        action={actions || defaultActions}
      />
      {children && <CardBody>{children}</CardBody>}
    </Card>
  );
}
