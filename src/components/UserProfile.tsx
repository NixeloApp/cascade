import type { Id } from "@convex/_generated/dataModel";
import { ProfileContent } from "./Settings/ProfileContent";
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
      <div className="max-h-panel overflow-y-auto px-6 pb-6">
        {/* We pass a prop to ProfileContent to remove its Card wrapper if we want,
             but ProfileContent currently returns a Card.
             It might be better to modify ProfileContent to accept a className or "variant"
             to avoid double borders if it's inside a dialog.
             For now, let's just render it. The nested card look is acceptable or we can strip it.
             Actually, let's fix ProfileContent to not force a Card if we don't want it.
         */}
        <ProfileContent userId={userId} />
      </div>
    </Dialog>
  );
}
