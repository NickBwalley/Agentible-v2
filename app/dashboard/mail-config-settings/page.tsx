"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";

type EmailConfigResponse = {
  configured: boolean;
  config: {
    from_email: string;
    terms_accepted_at: string | null;
    updated_at: string | null;
  } | null;
};

export default function MailConfigSettingsPage() {
  const { user, loading } = useUser();
  const [emailConfigLoaded, setEmailConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/email");
        await res.json();
        setEmailConfigLoaded(true);
      } catch {
        setEmailConfigLoaded(true);
      }
    }
    load();
  }, []);

  const signInEmail = (user?.email ?? "").trim();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          terms_accepted: termsAccepted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setMessage({ type: "success", text: data.message ?? "Sender email saved." });
    } catch {
      setMessage({ type: "error", text: "Request failed." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-white/70 hover:text-white"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Mail Config Settings</h1>
        <p className="mt-1 text-sm text-white/60">
          Set the email address we will use as the sender for your campaign emails. You can return here anytime to view or update it.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        {!emailConfigLoaded ? (
          <p className="text-white/60 text-sm">Loading…</p>
        ) : (
          <>
            <div className="mb-6 rounded-lg border border-[#2563EB]/30 bg-[#2563EB]/10 p-4 text-sm text-white/90">
              <p className="font-medium text-white mb-1">How sending works</p>
              <p>
                Campaign emails are sent through our own servers and are delivered to recipients
                end-to-end encrypted between you and the recipient. Your sign-in email will be
                used as the sender; no SMTP or password setup is required.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <Label className="text-white/90 mb-1.5 block">Sender email address</Label>
                <p className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white">
                  {signInEmail || "—"}
                </p>
                <p className="mt-1 text-xs text-white/50">
                  This is the email you signed in with. It will be used as the sender for your campaign emails.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms_accepted"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 rounded border-white/20 bg-white/5 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <Label htmlFor="terms_accepted" className="text-white/90 text-sm cursor-pointer">
                  I agree that my emails will be sent via your servers and delivered end-to-end
                  encrypted. I have read and accept the terms applicable to this service.
                </Label>
              </div>

              {message && (
                <p
                  className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}
                  role="alert"
                >
                  {message.text}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={saving || !signInEmail || !termsAccepted}
              >
                {saving ? "Saving…" : "Save sender email"}
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
