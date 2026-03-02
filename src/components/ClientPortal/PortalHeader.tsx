import { Typography } from "@/components/ui/Typography";

interface PortalHeaderProps {
  title: string;
  subtitle?: string;
}

export function PortalHeader({ title, subtitle }: PortalHeaderProps) {
  return (
    <header className="mb-6 border-b border-ui-border pb-4">
      <Typography variant="h2">{title}</Typography>
      {subtitle ? (
        <Typography variant="small" color="secondary" className="mt-1">
          {subtitle}
        </Typography>
      ) : null}
    </header>
  );
}
