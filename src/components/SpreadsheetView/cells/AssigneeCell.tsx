/**
 * AssigneeCell - Inline assignee selector
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { User, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Flex } from "@/components/ui/Flex";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { AuthenticatedUser } from "../../../../convex/lib/userUtils";

interface AssigneeCellProps {
  assignee: AuthenticatedUser | null;
  projectId: Id<"projects">;
  onUpdate?: (assigneeId: Id<"users"> | null) => void;
}

export function AssigneeCell({ assignee, projectId, onUpdate }: AssigneeCellProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Fetch project members for dropdown
  const project = useQuery(api.projects.getProject, { id: projectId });
  const members = project?.members || [];

  // Filter members by search
  const filteredMembers = members.filter(
    (member) =>
      member.name?.toLowerCase().includes(search.toLowerCase()) ||
      member.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const content = assignee ? (
    <Flex
      align="center"
      gap="sm"
      className={cn(
        "cursor-pointer px-1.5 py-0.5 rounded transition-colors",
        onUpdate && "hover:bg-ui-bg-secondary",
      )}
    >
      <Avatar src={assignee.image ?? undefined} name={assignee.name} size="xs" />
      <Typography variant="small" className="truncate max-w-24">
        {assignee.name}
      </Typography>
    </Flex>
  ) : (
    <Flex
      align="center"
      gap="sm"
      className={cn(
        "cursor-pointer px-1.5 py-0.5 rounded transition-colors text-ui-text-tertiary",
        onUpdate && "hover:bg-ui-bg-secondary hover:text-ui-text-secondary",
      )}
    >
      <User className="w-4 h-4" />
      <Typography variant="small">Unassigned</Typography>
    </Flex>
  );

  if (!onUpdate) {
    return content;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>{content}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <div className="p-2">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>

        {assignee && (
          <DropdownMenuItem
            onClick={() => {
              onUpdate(null);
              setIsOpen(false);
            }}
            className="text-status-error-text"
          >
            <Flex align="center" gap="sm">
              <X className="w-4 h-4" />
              <span>Remove assignee</span>
            </Flex>
          </DropdownMenuItem>
        )}

        {filteredMembers.map((member) => (
          <DropdownMenuItem
            key={member._id}
            onClick={() => {
              onUpdate(member._id);
              setIsOpen(false);
            }}
            className={cn(assignee?._id === member._id && "bg-ui-bg-secondary")}
          >
            <Flex align="center" gap="sm">
              <Avatar src={member.image ?? undefined} name={member.name} size="xs" />
              <span className="truncate">{member.name}</span>
            </Flex>
          </DropdownMenuItem>
        ))}

        {filteredMembers.length === 0 && (
          <Typography variant="small" color="tertiary" className="px-2 py-4 text-center block">
            No members found
          </Typography>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
