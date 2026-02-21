"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PROVIDERS = [
  { value: "", label: "Custom" },
  { value: "gmail", label: "Gmail" },
  { value: "outlook", label: "Outlook" },
] as const;

function getProviderPrefill(provider: string) {
  if (provider === "gmail") {
    return { smtp_host: "smtp.gmail.com", smtp_port: 587, smtp_secure: true };
  }
  if (provider === "outlook") {
    return { smtp_host: "smtp.office365.com", smtp_port: 587, smtp_secure: true };
  }
  return {};
}

type EmailConfigResponse = {
  configured: boolean;
  config: {
    smtp_host: string;
    smtp_port: number;
    smtp_secure: boolean;
    smtp_user: string;
    from_email: string;
    imap_host?: string | null;
    imap_port?: number | null;
    imap_user?: string | null;
    updated_at?: string;
  } | null;
};

export default function MailConfigSettingsPage() {
  const { user, loading } = useUser();
  const [emailConfigLoaded, setEmailConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [provider, setProvider] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapUser, setImapUser] = useState("");
  const [imapPassword, setImapPassword] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/email");
        const data: EmailConfigResponse = await res.json();
        setEmailConfigLoaded(true);
        if (data.configured && data.config) {
          const c = data.config;
          setSmtpHost(c.smtp_host ?? "");
          setSmtpPort(String(c.smtp_port ?? 587));
          setSmtpSecure(c.smtp_secure ?? true);
          setSmtpUser(c.smtp_user ?? "");
          setFromEmail(c.from_email ?? "");
          setImapHost(c.imap_host ?? "");
          setImapPort(String(c.imap_port ?? 993));
          setImapUser(c.imap_user ?? "");
          if (c.smtp_host === "smtp.gmail.com") setProvider("gmail");
          else if (c.smtp_host === "smtp.office365.com") setProvider("outlook");
        }
      } catch {
        setEmailConfigLoaded(true);
      }
    }
    load();
  }, []);

  const handleProviderChange = (value: string) => {
    setProvider(value);
    const prefill = getProviderPrefill(value);
    if (prefill.smtp_host) setSmtpHost(prefill.smtp_host);
    if (prefill.smtp_port != null) setSmtpPort(String(prefill.smtp_port));
    if (prefill.smtp_secure != null) setSmtpSecure(prefill.smtp_secure);
    if (value === "gmail") {
      setImapHost("imap.gmail.com");
      setImapPort("993");
    } else if (value === "outlook") {
      setImapHost("outlook.office365.com");
      setImapPort("993");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost.trim(),
          smtp_port: Number(smtpPort) || 587,
          smtp_secure: smtpSecure,
          smtp_user: smtpUser.trim(),
          smtp_password: smtpPassword || undefined,
          from_email: fromEmail.trim(),
          imap_host: imapHost.trim() || null,
          imap_port: imapPort ? Number(imapPort) : null,
          imap_user: imapUser.trim() || null,
          imap_password: imapPassword || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setMessage({ type: "success", text: data.message ?? "Email config saved." });
      setSmtpPassword("");
      setImapPassword("");
    } catch {
      setMessage({ type: "error", text: "Request failed." });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/email/test", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: data.message ?? "Connection successful." });
      } else {
        setMessage({ type: "error", text: data.error ?? "Connection failed." });
      }
    } catch {
      setMessage({ type: "error", text: "Test failed." });
    } finally {
      setTesting(false);
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
          Configure the email account used to send campaign emails. You can return here anytime to view or update these settings.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        {!emailConfigLoaded ? (
          <p className="text-white/60 text-sm">Loading…</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <Label className="text-white/90 mb-1.5 block">Provider</Label>
              <select
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.value || "custom"} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {provider === "gmail" && (
                <p className="mt-1 text-xs text-white/50">
                  Use an App Password (Google Account → Security → App passwords), not your normal password.
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/90 mb-1.5 block">SMTP host</Label>
                <Input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>
              <div>
                <Label className="text-white/90 mb-1.5 block">SMTP port</Label>
                <Input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtp_secure"
                checked={smtpSecure}
                onChange={(e) => setSmtpSecure(e.target.checked)}
                className="rounded border-white/20"
              />
              <Label htmlFor="smtp_secure" className="text-white/90">Use TLS / secure connection</Label>
            </div>
            <div>
              <Label className="text-white/90 mb-1.5 block">SMTP user (email)</Label>
              <Input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label className="text-white/90 mb-1.5 block">SMTP password</Label>
              <Input
                type="password"
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                placeholder={smtpUser ? "Leave blank to keep existing" : "App Password for Gmail"}
                autoComplete="off"
              />
            </div>
            <div>
              <Label className="text-white/90 mb-1.5 block">From address</Label>
              <Input
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                placeholder="Your Name &lt;you@example.com&gt;"
                required
              />
              <p className="mt-1 text-xs text-white/50">Display name and email recipients will see.</p>
            </div>
            <details className="text-white/80">
              <summary className="cursor-pointer text-sm font-medium">Optional: IMAP (for reply tracking later)</summary>
              <div className="mt-3 space-y-3 pl-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/90 mb-1.5 block">IMAP host</Label>
                    <Input
                      value={imapHost}
                      onChange={(e) => setImapHost(e.target.value)}
                      placeholder="imap.gmail.com"
                    />
                  </div>
                  <div>
                    <Label className="text-white/90 mb-1.5 block">IMAP port</Label>
                    <Input
                      type="number"
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                      placeholder="993"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/90 mb-1.5 block">IMAP user</Label>
                  <Input
                    value={imapUser}
                    onChange={(e) => setImapUser(e.target.value)}
                    placeholder="Same as SMTP usually"
                  />
                </div>
                <div>
                  <Label className="text-white/90 mb-1.5 block">IMAP password</Label>
                  <Input
                    type="password"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    placeholder="Leave blank to keep existing"
                    autoComplete="off"
                  />
                </div>
              </div>
            </details>
            {message && (
              <p
                className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}
                role="alert"
              >
                {message.text}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="primary" size="md" disabled={saving}>
                {saving ? "Saving…" : "Save email config"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleTest}
                disabled={testing || !smtpHost}
              >
                {testing ? "Testing…" : "Test connection"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
