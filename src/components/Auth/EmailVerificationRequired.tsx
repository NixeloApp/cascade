import { api } from "@convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { Flex } from "@/components/ui/Flex";
import { Button } from "../ui/Button";
import { Input } from "../ui/form/Input";
import { AuthLinkButton } from "./AuthLink";
import { AuthPageLayout } from "./AuthPageLayout";

export function EmailVerificationRequired() {
  const { signIn, signOut } = useAuthActions();
  const user = useQuery(api.auth.loggedInUser);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const email = user?.email || "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Email verified successfully!");
      })
      .catch(() => {
        toast.error("Invalid code. Please try again.");
      })
      .finally(() => setSubmitting(false));
  };

  const handleResend = () => {
    setResending(true);

    const formData = new FormData();
    formData.set("email", email);
    formData.set("flow", "email-verification");

    void signIn("password", formData)
      .then(() => {
        toast.success("Verification code sent!");
      })
      .catch(() => {
        toast.error("Could not resend code. Please try again.");
      })
      .finally(() => setResending(false));
  };

  const handleSignOut = () => {
    void signOut();
  };

  return (
    <AuthPageLayout
      title="Check your email"
      subtitle={
        <>
          We sent a code to <strong>{email}</strong>
        </>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          className="text-center text-xl tracking-widest"
          type="tel"
          inputMode="numeric"
          name="code"
          placeholder="Enter 8-digit code"
          required
          pattern="[0-9]{8}"
          maxLength={8}
        />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Verifying..." : "Verify email"}
        </Button>
      </form>

      <Flex direction="column" align="center" gap="sm" className="mt-6">
        <AuthLinkButton onClick={handleResend} disabled={resending}>
          {resending ? "Sending..." : "Resend code"}
        </AuthLinkButton>
        <AuthLinkButton onClick={handleSignOut} variant="muted">
          Use a different account
        </AuthLinkButton>
      </Flex>
    </AuthPageLayout>
  );
}
