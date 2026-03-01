/**
 * User Profile
 *
 * Modal dialog for viewing and editing user profile.
 * Displays user info with options to update avatar and settings.
 * Wraps ProfileContent component in a dialog layout.
 */

import type { Id } from "@convex/_generated/dataModel";
import { ProfileContent } from "./Settings/ProfileContent";
import { Card } from "./ui/Card";
import { Dialog } from "./ui/Dialog";

interface UserProfileProps {
  userId?: Id<"users">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Dialog for viewing and editing a user's profile. */
export function UserProfile({ userId, open, onOpenChange }: UserProfileProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="User Profile"
      size="xl"
      className="p-0 gap-0 overflow-hidden"
    >
      <Card padding="lg" variant="ghost" radius="none" className="overflow-y-auto pt-0">
        <ProfileContent userId={userId} />
      </Card>
    </Dialog>
  );
}
