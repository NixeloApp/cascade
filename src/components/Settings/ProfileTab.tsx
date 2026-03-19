import { Stack } from "../ui/Stack";
import { OutOfOfficeSettings } from "./OutOfOfficeSettings";
import { ProfileContent } from "./ProfileContent";

/** Settings tab wrapper for user profile content. */
export function ProfileTab() {
  return (
    <Stack gap="lg">
      <ProfileContent />
      <OutOfOfficeSettings />
    </Stack>
  );
}
