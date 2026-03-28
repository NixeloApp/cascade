import type { LucideIcon } from "lucide-react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Download, Trash2 } from "@/lib/icons";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { ListItem, ListItemActions } from "./ListItem";
import { Typography } from "./Typography";

interface AttachmentRowProps {
  deleteLabel?: string;
  downloadLabel?: string;
  filename: string;
  href?: string | null;
  icon: LucideIcon;
  linkProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href">;
  onDelete?: () => void;
  subtitle?: ReactNode;
}

export function AttachmentRow({
  deleteLabel,
  downloadLabel = "Download attachment",
  filename,
  href,
  icon,
  linkProps,
  onDelete,
  subtitle,
}: AttachmentRowProps) {
  return (
    <Card recipe="attachmentRow" padding="sm" hoverable={Boolean(href)} className="group">
      <ListItem
        size="sm"
        interactive={Boolean(href)}
        icon={<Icon icon={icon} size="lg" />}
        title={
          href ? (
            <Button
              variant="link"
              size="content"
              className="max-w-full justify-start truncate text-ui-text"
              asChild
            >
              <a href={href} {...linkProps}>
                {filename}
              </a>
            </Button>
          ) : (
            <Typography variant="label" color="tertiary" className="truncate">
              {filename} (unavailable)
            </Typography>
          )
        }
        subtitle={subtitle}
        meta={
          <ListItemActions>
            {href && (
              <Button
                variant="ghost"
                size="sm"
                reveal="responsive"
                aria-label={downloadLabel}
                asChild
              >
                <a href={href} download={filename} {...linkProps}>
                  <Icon icon={Download} size="sm" />
                </a>
              </Button>
            )}
            {onDelete && (
              <IconButton
                variant="danger"
                size="sm"
                reveal="responsive"
                onClick={onDelete}
                aria-label={deleteLabel}
                tooltip={deleteLabel}
              >
                <Icon icon={Trash2} size="sm" />
              </IconButton>
            )}
          </ListItemActions>
        }
      />
    </Card>
  );
}
