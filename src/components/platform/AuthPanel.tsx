"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import {
  createDemoSession,
  sendPasswordResetEmail,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/auth/client-actions";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

export function parseAuthMode(value: string | null): AuthMode {
  if (value === "signup" || value === "sign-up") return "sign-up";
  if (value === "forgot" || value === "forgot-password") return "forgot-password";
  return "sign-in";
}

export function AuthPanel({ initialMode }: { initialMode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next")?.startsWith("/dashboard")
    ? searchParams.get("next")!
    : "/dashboard/menus";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  }

  async function completeSignIn(trimmedEmail: string) {
    await createDemoSession(trimmedEmail, remember);
    router.push(nextPath);
    router.refresh();
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setError("Enter your email and password to continue.");
        return;
      }

      const result = await signInWithEmail(trimmedEmail, password);
      if (result.mode === "supabase") {
        router.push(nextPath);
        router.refresh();
        return;
      }

      await completeSignIn(trimmedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (!fullName.trim() || !trimmedEmail || !password || !confirmPassword) {
        setError("Complete all required fields to create your account.");
        return;
      }

      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const result = await signUpWithEmail({
        email: trimmedEmail,
        password,
        fullName: fullName.trim(),
        restaurantName: restaurantName.trim() || undefined,
      });

      setMessage(result.message);

      if (result.mode === "demo") {
        await completeSignIn(trimmedEmail);
        return;
      }

      if (result.message.includes("Check your email")) {
        switchMode("sign-in");
      } else {
        router.push(nextPath);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("Enter the email address for your account.");
        return;
      }

      const result = await sendPasswordResetEmail(trimmedEmail);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  const titles = {
    "sign-in": {
      eyebrow: "Welcome back",
      title: "Sign in to Kāti",
      description: "Manage your menus, website, orders, and guest-facing pages.",
    },
    "sign-up": {
      eyebrow: "Get started",
      title: "Create your account",
      description: "Set up your restaurant on Kāti in minutes.",
    },
    "forgot-password": {
      eyebrow: "Account recovery",
      title: "Reset your password",
      description: "We will email you a secure link to choose a new password.",
    },
  } as const;

  const copy = titles[mode];

  return (
    <div className="mb-6">
      <div className="mb-5">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl tracking-tight text-pine-900 sm:text-[2rem]">
          {copy.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-pine-600">{copy.description}</p>
      </div>

      {mode !== "forgot-password" ? (
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-pine-900/[0.04] p-1 ring-1 ring-pine-900/5">
          {(
            [
              ["sign-in", "Sign in"],
              ["sign-up", "Create account"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => switchMode(value)}
              className={cn(
                "min-h-11 rounded-xl px-2 py-2.5 text-center text-sm font-medium leading-tight touch-manipulation transition duration-200 sm:px-4",
                mode === value
                  ? "bg-white text-pine-900 shadow-soft ring-1 ring-pine-900/5"
                  : "text-pine-600 [@media(hover:hover)]:hover:text-pine-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {mode === "sign-in" ? (
        <form onSubmit={handleSignIn} className="landing-auth-card space-y-5">
          <AuthAlerts error={error} message={message} />
          <EmailField email={email} onChange={setEmail} />
          <PasswordField
            password={password}
            showPassword={showPassword}
            onPasswordChange={setPassword}
            onToggleShow={() => setShowPassword((value) => !value)}
            autoComplete="current-password"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-pine-600">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-pine-300 text-pine-800 focus:ring-pine-500"
              />
              Keep me signed in
            </label>
            <button
              type="button"
              onClick={() => switchMode("forgot-password")}
              className="inline-flex min-h-11 items-center text-sm font-medium text-pine-700 underline-offset-2 touch-manipulation [@media(hover:hover)]:hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <SubmitButton loading={loading} label="Sign in" />
        </form>
      ) : null}

      {mode === "sign-up" ? (
        <form onSubmit={handleSignUp} className="landing-auth-card space-y-5">
          <AuthAlerts error={error} message={message} />
          <Field
            id="full-name"
            label="Full name"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            placeholder="Alex Morgan"
            required
          />
          <Field
            id="restaurant-name"
            label="Restaurant name"
            value={restaurantName}
            onChange={setRestaurantName}
            placeholder="Your venue name"
          />
          <EmailField email={email} onChange={setEmail} />
          <PasswordField
            password={password}
            showPassword={showPassword}
            onPasswordChange={setPassword}
            onToggleShow={() => setShowPassword((value) => !value)}
            autoComplete="new-password"
            hint="At least 8 characters"
          />
          <Field
            id="confirm-password"
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            required
          />
          <SubmitButton loading={loading} label="Create account" />
          <p className="text-center text-xs leading-relaxed text-pine-500">
            By creating an account, you agree to use Kāti for your restaurant operations.
          </p>
        </form>
      ) : null}

      {mode === "forgot-password" ? (
        <form onSubmit={handleForgotPassword} className="landing-auth-card space-y-5">
          <AuthAlerts error={error} message={message} />
          <EmailField email={email} onChange={setEmail} />
          <SubmitButton loading={loading} label="Send reset link" />
          <button
            type="button"
            onClick={() => switchMode("sign-in")}
            className="w-full text-sm font-medium text-pine-600 underline-offset-2 hover:text-pine-900 hover:underline"
          >
            Back to sign in
          </button>
        </form>
      ) : null}
    </div>
  );
}

function AuthAlerts({ error, message }: { error: string | null; message: string | null }) {
  return (
    <>
      {error ? <div className="alert-error">{error}</div> : null}
      {message ? <div className="alert-success">{message}</div> : null}
    </>
  );
}

function EmailField({
  email,
  onChange,
}: {
  email: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor="email" className="label">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => onChange(event.target.value)}
        className="input"
        placeholder="you@restaurant.co.nz"
      />
    </div>
  );
}

function PasswordField({
  password,
  showPassword,
  onPasswordChange,
  onToggleShow,
  autoComplete,
  hint,
}: {
  password: string;
  showPassword: boolean;
  onPasswordChange: (value: string) => void;
  onToggleShow: () => void;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor="password" className="label mb-0">
          Password
        </label>
        <button
          type="button"
          className="text-xs font-medium text-pine-500 hover:text-pine-800"
          onClick={onToggleShow}
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          className="input pr-11"
          placeholder={hint ?? "Enter your password"}
        />
        <button
          type="button"
          className="absolute right-1 top-1/2 inline-flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center text-pine-400 touch-manipulation [@media(hover:hover)]:hover:text-pine-700"
          onClick={onToggleShow}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-pine-500">{hint}</p> : null}
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        className="input"
      />
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="btn-primary w-full py-3"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Please wait…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
