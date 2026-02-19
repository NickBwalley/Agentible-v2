"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 pl-9 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]";

export function SignupCard() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;
    const fullName = (formData.get("fullName") as string)?.trim();

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || undefined },
        },
      });
      if (signUpError) {
        const msg = signUpError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("rate_limit")) {
          setError(
            "Too many signup attempts. Please wait a few minutes and try again. If you already signed up, check your email for the confirmation link."
          );
        } else {
          setError(signUpError.message);
        }
        return;
      }
      if (data.user?.identities?.length === 0) {
        setError("An account with this email already exists. Try signing in.");
        return;
      }
      if (data.user && !data.session) {
        setMessage("Check your email for the confirmation link to activate your account.");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = message !== null;

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl p-6">
        {showSuccess ? (
          <div className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4" aria-hidden>
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">Check your email</h1>
            <p className="mt-3 text-white/90">
              Check your email for the confirmation link to activate your account.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-block text-sm font-medium text-[#2563EB] hover:underline"
            >
              Back to Log In
            </Link>
          </div>
        ) : (
          <>
        <h1 className="text-xl font-bold text-white">Create an account</h1>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Full Name *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                placeholder="Enter your Full Name"
                className={`${inputClass} pl-9`}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Work Email *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Enter your work-email"
                className={`${inputClass} pl-9`}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Create a Password *</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Enter your password"
                className={`${inputClass} pl-9 pr-9`}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">{error}</p>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full" disabled={loading}>
            {loading ? "Signing up…" : "Signup"}
          </Button>

          <div className="relative flex items-center justify-center py-1">
            <span className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </span>
            <span className="relative bg-transparent px-2 text-xs text-white/60">or continue with</span>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handleGoogleSignUp}
            disabled={loading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Loading…" : "Google"}
          </Button>

          <p className="text-center text-xs text-white/60">
            By clicking &quot;Signup&quot;, you agree to our{" "}
            <Link href="/privacy" className="text-[#2563EB] underline hover:no-underline">Privacy Policy</Link>
            {" "}and{" "}
            <Link href="/terms" className="text-[#2563EB] underline hover:no-underline">Terms of Service</Link>.
          </p>
        </form>

      <p className="mt-6 text-center text-sm text-white/70">
        Already have an account?{" "}
        <Link href="/signin" className="text-[#2563EB] font-medium underline hover:no-underline">
          Login
        </Link>
      </p>
          </>
        )}
      </div>
    </div>
  );
}
