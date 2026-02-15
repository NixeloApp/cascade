/**
 * Collaborators Component
 *
 * Displays avatars of users currently editing a document.
 * Shows cursor colors and names on hover.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvex, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { type AwarenessUser, createAwarenessManager, getUserColor } from "@/lib/yjs/awareness";

interface CollaboratorsProps {
  documentId: Id<"documents">;
  maxVisible?: number;
  className?: string;
}

/**
 * Collaborators - Shows active users editing a document
 */
export function Collaborators({ documentId, maxVisible = 5, className }: CollaboratorsProps) {
  const convex = useConvex();
  const [collaborators, setCollaborators] = useState<AwarenessUser[]>([]);

  // Get current user
  const currentUser = useQuery(api.users.getCurrent);

  useEffect(() => {
    if (!convex || !currentUser) {
      return;
    }

    const manager = createAwarenessManager(documentId, convex, {
      name: currentUser.name || "Anonymous",
      image: currentUser.image,
    });

    manager.connect();

    const unsubscribe = manager.onUpdate((users) => {
      // Filter out current user from collaborators display
      setCollaborators(users.filter((u) => !u.isCurrentUser));
    });

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [documentId, convex, currentUser]);

  if (collaborators.length === 0) {
    return null;
  }

  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  return (
    <Flex align="center" className={cn("-space-x-2", className)}>
      {visible.map((user) => (
        <CollaboratorAvatar key={user.userId} user={user} />
      ))}
      {overflow > 0 && (
        <Tooltip content={`${overflow} more ${overflow === 1 ? "collaborator" : "collaborators"}`}>
          <Flex
            align="center"
            justify="center"
            className="relative z-10 h-8 w-8 rounded-full border-2 border-ui-bg bg-ui-bg-subtle text-caption text-ui-text-secondary"
          >
            +{overflow}
          </Flex>
        </Tooltip>
      )}
    </Flex>
  );
}

interface CollaboratorAvatarProps {
  user: AwarenessUser;
}

function CollaboratorAvatar({ user }: CollaboratorAvatarProps) {
  const color = user.user?.color || getUserColor(user.userId).main;
  const name = user.user?.name || "Anonymous";

  return (
    <Tooltip
      content={
        <div>
          <Typography variant="p" className="font-medium">
            {name}
          </Typography>
          <Typography variant="muted" className="text-xs">
            Currently editing
          </Typography>
        </div>
      }
    >
      <div className="relative z-10 rounded-full border-2" style={{ borderColor: color }}>
        <Avatar name={name} src={user.user?.image} size="sm" className="h-7 w-7" />
        {/* Online indicator */}
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-ui-bg"
          style={{ backgroundColor: color }}
        />
      </div>
    </Tooltip>
  );
}

/**
 * Hook to get collaborator count
 */
export function useCollaboratorCount(documentId: Id<"documents">): number {
  const convex = useConvex();
  const [count, setCount] = useState(0);
  const currentUser = useQuery(api.users.getCurrent);

  useEffect(() => {
    if (!convex || !currentUser) {
      return;
    }

    const manager = createAwarenessManager(documentId, convex, {
      name: currentUser.name || "Anonymous",
      image: currentUser.image,
    });

    manager.connect();

    const unsubscribe = manager.onUpdate((users) => {
      setCount(users.filter((u) => !u.isCurrentUser).length);
    });

    return () => {
      unsubscribe();
      manager.disconnect();
    };
  }, [documentId, convex, currentUser]);

  return count;
}
