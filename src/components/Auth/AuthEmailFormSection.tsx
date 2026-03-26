import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Mail } from "@/lib/icons";
import { TEST_IDS } from "@/lib/test-ids";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";

interface AuthEmailFormSectionProps {
  open: boolean;
  submitting: boolean;
  submitLabel: string;
  onRequestOpen: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared progressive-disclosure shell for auth email/password flows.
 * Keeps the reveal behavior consistent without relying on height hacks.
 */
export function AuthEmailFormSection({
  open,
  submitting,
  submitLabel,
  onRequestOpen,
  children,
  footer,
  className,
}: AuthEmailFormSectionProps) {
  return (
    <Stack gap={open ? "md" : "sm"} className={className}>
      {open ? (
        <Stack gap="md" className="animate-fade-in" data-testid={TEST_IDS.AUTH.EMAIL_FORM}>
          <span data-testid={TEST_IDS.AUTH.FORM_READY} hidden aria-hidden="true" />
          {children}
        </Stack>
      ) : null}

      {open && footer ? <div className="text-right">{footer}</div> : null}

      <Button
        type={open ? "submit" : "button"}
        onClick={!open ? onRequestOpen : undefined}
        variant={open ? "primary" : "secondary"}
        size="lg"
        className={cn("w-full transition-default", open && "shadow-card")}
        isLoading={open && submitting}
        leftIcon={!open ? <Icon icon={Mail} size="md" /> : undefined}
        data-testid={TEST_IDS.AUTH.SUBMIT_BUTTON}
      >
        {open ? submitLabel : "Continue with email"}
      </Button>
    </Stack>
  );
}
