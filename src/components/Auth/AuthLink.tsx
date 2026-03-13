import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/Button";

interface AuthLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

/**
 * Styled link for auth pages (Sign up, Sign in, etc.)
 * Uses TanStack Router Link
 */
export function AuthLink({ to, children, className = "" }: AuthLinkProps) {
  return (
    <Button asChild variant="authLink" size="none" className={cn("cursor-pointer", className)}>
      <Link to={to}>{children}</Link>
    </Button>
  );
}

interface AuthLinkButtonProps {
  onClick: () => void;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "muted";
}

/**
 * Styled button that looks like a link for auth pages
 * For actions that need onClick instead of navigation
 */
export function AuthLinkButton({
  onClick,
  children,
  className = "",
  disabled = false,
  variant = "default",
}: AuthLinkButtonProps) {
  return (
    <Button
      variant={variant === "muted" ? "authLinkMuted" : "authLink"}
      size="none"
      onClick={onClick}
      disabled={disabled}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </Button>
  );
}
