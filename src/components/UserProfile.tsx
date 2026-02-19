import type { Id } from "@convex/_generated/dataModel";
import { ProfileContent } from "./Settings/ProfileContent";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";

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
      <Card padding="lg" variant="ghost" radius="none" className="max-h-panel overflow-y-auto pt-0">
        <ProfileContent userId={userId} />
      </Card>
    </Dialog>
  );
}
