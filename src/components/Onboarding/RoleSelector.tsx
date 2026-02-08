import { Check, User, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Flex } from "@/components/ui/Flex";
import { Grid } from "@/components/ui/Grid";
import { cn } from "@/lib/utils";
import { Typography } from "../ui/Typography";

interface RoleSelectorProps {
  onSelect: (role: "team_lead" | "team_member") => void;
}

interface RoleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function RoleCard({ icon, title, description, selected, disabled, onClick }: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "relative p-8 rounded-container border-2 text-left transition-all duration-default cursor-pointer overflow-hidden group w-full",
        "hover:shadow-card-hover hover:-translate-y-1 active:scale-98",
        selected
          ? "border-brand bg-brand-subtle/50 ring-4 ring-brand/10"
          : "border-ui-border bg-ui-bg hover:border-ui-border-secondary",
        disabled && "opacity-50 cursor-wait",
      )}
    >
      {/* Selection indicator - Mintlify-inspired */}
      <div
        className={cn(
          "absolute top-4 right-4 w-6 h-6 rounded-full transition-all duration-default flex items-center justify-center z-10",
          selected
            ? "bg-brand scale-100"
            : "border-2 border-ui-border-secondary group-hover:border-brand-muted scale-100",
        )}
      >
        <Check
          className={cn(
            "w-3.5 h-3.5 text-brand-foreground transition-all duration-default",
            selected ? "opacity-100 scale-100" : "opacity-0 scale-50",
          )}
        />
      </div>

      <Flex direction="column" align="center" gap="xl" className="text-center relative z-10">
        <div
          className={cn(
            "p-5 rounded-xl transition-all duration-default",
            selected
              ? "bg-brand text-brand-foreground scale-105"
              : "bg-ui-bg-tertiary text-ui-text-secondary group-hover:scale-105 group-hover:bg-brand-subtle group-hover:text-brand",
          )}
        >
          {icon}
        </div>

        <div className="space-y-3">
          <Typography variant="h3" className="text-xl font-bold text-ui-text tracking-tight">
            {title}
          </Typography>
          <Typography className="text-sm text-ui-text-secondary leading-relaxed max-w-56">
            {description}
          </Typography>
        </div>
      </Flex>
    </button>
  );
}

export function RoleSelector({ onSelect }: RoleSelectorProps) {
  const [isPending, setIsPending] = useState(false);
  const [localSelected, setLocalSelected] = useState<"team_lead" | "team_member" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSelect = (role: "team_lead" | "team_member") => {
    setLocalSelected(role);
    setIsPending(true);

    // Small delay for visual feedback before transitioning
    timeoutRef.current = setTimeout(() => {
      onSelect(role);
    }, 400);
  };

  return (
    <Grid cols={1} colsSm={2} gap="xl" className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <RoleCard
        icon={<Users className="w-10 h-10" />}
        title="Team Lead"
        description="I'll be building new projects and inviting my team to join"
        selected={localSelected === "team_lead"}
        disabled={isPending}
        onClick={() => handleSelect("team_lead")}
      />
      <RoleCard
        icon={<User className="w-10 h-10" />}
        title="Team Member"
        description="I'm joining an existing workspace to collaborate on tasks"
        selected={localSelected === "team_member"}
        disabled={isPending}
        onClick={() => handleSelect("team_member")}
      />
    </Grid>
  );
}
