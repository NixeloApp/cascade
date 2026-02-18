import type { Id } from "@convex/_generated/dataModel";
import { ProfileContent } from "./Settings/ProfileContent";
import { Dialog } from "./ui/Dialog";
import { Stack } from "./ui/Stack";

interface UserProfileProps {
  userId?: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfile({ userId, open, onOpenChange }: UserProfileProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="User Profile"
      className="sm:max-w-4xl p-0 gap-0 overflow-hidden"
    >
      <Stack className="max-h-panel overflow-y-auto px-6 pb-6">
        <ProfileContent userId={userId} />
      </Stack>
    </Dialog>
  );
}
