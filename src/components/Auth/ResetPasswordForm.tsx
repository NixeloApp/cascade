import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { Typography } from "../ui/Typography";
import { AuthLinkButton } from "./AuthLink";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

interface ResetPasswordFormProps {
  email: string;
  onSuccess: () => void;
  onRetry: () => void;
}

export function ResetPasswordForm({ email, onSuccess, onRetry }: ResetPasswordFormProps) {
  const { signIn } = useAuthActions();
  const [submitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    formData.set("flow", "reset-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Password reset successfully!");
        onSuccess();
      })
      .catch((_error) => {
        toast.error("Invalid code or password. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="w-full">
      <Typography variant="h2" className="text-xl font-semibold mb-4">
        Enter reset code
      </Typography>
      <Typography variant="p" color="secondary" className="mb-4 text-sm">
        We sent a code to <strong>{email}</strong>. Enter it below with your new password.
      </Typography>
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <Input
          type="text"
          name="code"
          placeholder="8-digit code"
          required
          pattern="[0-9]{8}"
          maxLength={8}
        />
        <Input
          type="password"
          name="newPassword"
          placeholder="New password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordStrengthIndicator password={newPassword} className="-mt-2" />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Resetting..." : "Reset password"}
        </Button>
        <AuthLinkButton onClick={onRetry}>Didn't receive a code? Try again</AuthLinkButton>
      </form>
    </div>
  );
}
