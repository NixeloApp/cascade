import { api } from "@convex/_generated/api";
import FacePile from "@convex-dev/presence/facepile";
import usePresence from "@convex-dev/presence/react";
import { Flex } from "@/components/ui/Flex";
import { MetadataItem } from "@/components/ui/Metadata";

// Type cast for presence API which has complex generated type incompatibilities
type PresenceApi = Parameters<typeof usePresence>[0];

interface PresenceIndicatorProps {
  roomId: string;
  userId: string;
}

export function PresenceIndicator({ roomId, userId }: PresenceIndicatorProps) {
  const presenceState = usePresence(api.presence as PresenceApi, roomId, userId);

  if (!presenceState) {
    return null;
  }

  return (
    <Flex align="center" className="space-x-2">
      <MetadataItem>
        {presenceState.length} {presenceState.length === 1 ? "person" : "people"} editing
      </MetadataItem>
      <FacePile presenceState={presenceState} />
    </Flex>
  );
}
