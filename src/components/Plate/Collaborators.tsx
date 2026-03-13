/**
 * Collaborators Component
 *
 * Displays avatars of users currently editing a document.
 * Shows cursor colors and names on hover.
 */

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { Avatar, AvatarGroup } from "@/components/ui/Avatar";
import { Flex } from "@/components/ui/Flex";
import { Tooltip } from "@/components/ui/Tooltip";
import { Typography } from "@/components/ui/Typography";
import { useAuthenticatedQuery } from "@/hooks/useConvexHelpers";
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
  const [collaborators, setCollaborators] = useState<AwarenessUser[]>([]);

  // Get current user
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});

  useEffect(() => {
    if (!currentUser) {
      setCollaborators([]);
      return;
    }

    const manager = createAwarenessManager(documentId, {
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
  }, [documentId, currentUser]);

  if (collaborators.length === 0) {
    return null;
  }

  const overflow = Math.max(0, collaborators.length - maxVisible);

  return (
    <AvatarGroup
      max={maxVisible}
      size="stackedSm"
      stackStyle="clean"
      overflowVariant="collaborator"
      overflowTooltipContent={`${overflow} more ${overflow === 1 ? "collaborator" : "collaborators"}`}
      className={className}
    >
      {collaborators.map((user) => (
        <CollaboratorAvatar key={user.userId} user={user} />
      ))}
    </AvatarGroup>
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
        <Flex direction="column" gap="xs">
          <Typography variant="label">{name}</Typography>
          <Typography variant="muted">Currently editing</Typography>
        </Flex>
      }
    >
      <Avatar
        name={name}
        src={user.user?.image}
        size="stackedSm"
        treatment="collaborator"
        style={{ borderColor: color }}
        indicator
        indicatorColor={color}
      />
    </Tooltip>
  );
}

/**
 * Hook to get collaborator count
 */
export function useCollaboratorCount(documentId: Id<"documents">): number {
  const [count, setCount] = useState(0);
  const currentUser = useAuthenticatedQuery(api.users.getCurrent, {});

  useEffect(() => {
    if (!currentUser) {
      setCount(0);
      return;
    }

    const manager = createAwarenessManager(documentId, {
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
  }, [documentId, currentUser]);

  return count;
}
