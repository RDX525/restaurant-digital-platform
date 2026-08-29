"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage } from "@/lib/utils";
import { PlatformBrand } from "@/components/platform/PlatformBrand";

export function AcceptInviteClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invite link is missing a token.");
      return;
    }

    let cancelled = false;

    async function acceptInvite() {
      setStatus("loading");
      try {
        const response = await fetch("/api/invites/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to accept invite.");
        }
        if (cancelled) return;
        setStatus("success");
        setMessage("Invite accepted. Redirecting to dashboard…");
        router.push("/dashboard/orders");
        router.refresh();
      } catch (error) {
        if (cancelled) return;
        setStatus("error");
        setMessage(getErrorMessage(error));
      }
    }

    void acceptInvite();
    return () => {
      cancelled = true;
    };
  }, [router, token]);

  return (
    <div className="platform-page flex min-h-screen items-center justify-center px-4 py-16">
      <div className="platform-card w-full max-w-md p-8 text-center">
        <PlatformBrand href="/" size="md" />
        <h1 className="mt-6 font-display text-2xl text-pine-900">Accept team invite</h1>
        <p className="mt-3 text-sm text-pine-600">
          {status === "loading"
            ? "Confirming your invite…"
            : status === "success"
              ? message
              : message ?? "Preparing invite acceptance…"}
        </p>
        {status === "error" ? (
          <Link
            href="/?mode=sign-in"
            className="mt-6 inline-flex rounded-xl bg-pine-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Sign in and try again
          </Link>
        ) : null}
      </div>
    </div>
  );
}
