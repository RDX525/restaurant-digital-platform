"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { PlatformBrand } from "@/components/platform/PlatformBrand";
import { updatePassword } from "@/lib/auth/client-actions";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard/menus");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative platform-page flex min-h-screen items-center justify-center overflow-hidden px-6 py-12">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-20 h-56 w-56 rounded-full bg-pine-500/8 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md animate-slide-up">
        <PlatformBrand href="/" size="md" className="mb-8" />

        <div className="landing-auth-card">
          <p className="eyebrow">Secure reset</p>
          <h1 className="mt-2 font-display text-3xl text-pine-900">Choose a new password</h1>
          <p className="mt-2 text-sm text-pine-600">
            Enter a new password for your Kāti account.
          </p>

          {done ? (
            <div className="alert-success mt-6">
              Password updated. Redirecting to your dashboard…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error ? <div className="alert-error">{error}</div> : null}
              <div>
                <label htmlFor="new-password" className="label">
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="label">
                  Confirm password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    Update password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
