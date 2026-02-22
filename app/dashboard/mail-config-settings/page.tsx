"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/lib/hooks/use-user";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type EmailConfigResponse = {
  configured: boolean;
  has_smtp: boolean;
  has_imap: boolean;
  config: {
    from_email: string | null;
    terms_accepted_at: string | null;
    updated_at: string | null;
    smtp_host: string | null;
    smtp_port: number | null;
    smtp_secure: boolean | null;
    smtp_user: string | null;
    imap_host: string | null;
    imap_port: number | null;
    imap_secure: boolean | null;
    imap_user: string | null;
  } | null;
};

export default function MailConfigSettingsPage() {
  const { user, loading } = useUser();
  const [config, setConfig] = useState<EmailConfigResponse["config"]>(null);
  const [hasSmtp, setHasSmtp] = useState(false);
  const [hasImap, setHasImap] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [imapSaving, setImapSaving] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [imapMessage, setImapMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [imapSecure, setImapSecure] = useState(true);
  const [imapUser, setImapUser] = useState("");
  const [imapPassword, setImapPassword] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/email");
        const data = (await res.json()) as EmailConfigResponse;
        setConfig(data.config ?? null);
        setHasSmtp(data.has_smtp ?? false);
        setHasImap(data.has_imap ?? false);
        if (data.config) {
          setSmtpHost(data.config.smtp_host ?? "");
          setSmtpPort(
            data.config.smtp_port != null ? String(data.config.smtp_port) : "587"
          );
          setSmtpSecure(data.config.smtp_secure ?? true);
          setSmtpUser(data.config.smtp_user ?? "");

          setImapHost(data.config.imap_host ?? "");
          setImapPort(
            data.config.imap_port != null ? String(data.config.imap_port) : "993"
          );
          setImapSecure(data.config.imap_secure ?? true);
          setImapUser(data.config.imap_user ?? "");
        }
      } catch {
        // ignore
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, [user?.email]);

  const refreshConfig = async () => {
    const res = await fetch("/api/settings/email");
    const data = (await res.json()) as EmailConfigResponse;
    const c = data.config ?? null;
    setConfig(c);
    setHasSmtp(data.has_smtp ?? false);
    setHasImap(data.has_imap ?? false);
    if (c) {
      setSmtpHost(c.smtp_host ?? "");
      setSmtpPort(c.smtp_port != null ? String(c.smtp_port) : "587");
      setSmtpSecure(c.smtp_secure ?? true);
      setSmtpUser(c.smtp_user ?? "");
      setImapHost(c.imap_host ?? "");
      setImapPort(c.imap_port != null ? String(c.imap_port) : "993");
      setImapSecure(c.imap_secure ?? true);
      setImapUser(c.imap_user ?? "");
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpMessage(null);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost.trim(),
          smtp_port: parseInt(smtpPort, 10) || 587,
          smtp_secure: smtpSecure,
          smtp_user: smtpUser.trim(),
          smtp_password: smtpPassword || undefined,
          from_email: smtpUser.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSmtpMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setSmtpMessage({
        type: "success",
        text: data.message ?? "SMTP settings saved.",
      });
      setSmtpPassword("");
      await refreshConfig();
    } catch {
      setSmtpMessage({ type: "error", text: "Request failed." });
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleSaveImap = async (e: React.FormEvent) => {
    e.preventDefault();
    setImapSaving(true);
    setImapMessage(null);
    try {
      const res = await fetch("/api/settings/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imap_host: imapHost.trim(),
          imap_port: parseInt(imapPort, 10) || 993,
          imap_secure: imapSecure,
          imap_user: imapUser.trim(),
          imap_password: imapPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setImapMessage({ type: "error", text: data.error ?? "Failed to save" });
        return;
      }
      setImapMessage({
        type: "success",
        text: data.message ?? "IMAP settings saved.",
      });
      setImapPassword("");
      await refreshConfig();
    } catch {
      setImapMessage({ type: "error", text: "Request failed." });
    } finally {
      setImapSaving(false);
    }
  };

  const signInEmail = (user?.email ?? "").trim();
  const canSaveSmtp =
    smtpHost.trim() &&
    smtpUser.trim() &&
    (smtpPassword || hasSmtp);
  const canSaveImap =
    imapHost.trim() &&
    imapUser.trim() &&
    (imapPassword || hasImap);

  if (loading || !user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-20 space-y-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-white/70 hover:text-white"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">
          Mail Config Settings
        </h1>
        <p className="mt-1 text-sm text-white/60">
          Configure SMTP for sending campaign emails and IMAP for syncing
          replies. Both use your own server; passwords are stored encrypted.
        </p>
      </div>

      {!loaded ? (
        <p className="text-white/60 text-sm">Loading…</p>
      ) : (
        <>
          {/* SMTP Config Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">SMTP Config</CardTitle>
              <CardDescription className="text-white/70">
                Used to send campaign emails. Required to run campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSmtp} className="space-y-4">
                <div>
                  <Label
                    htmlFor="smtp_host"
                    className="text-white/90 mb-1.5 block"
                  >
                    SMTP host (domain)
                  </Label>
                  <Input
                    id="smtp_host"
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="smtp_port"
                      className="text-white/90 mb-1.5 block"
                    >
                      Port
                    </Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      min={1}
                      max={65535}
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="587"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={smtpSecure}
                        onChange={(e) => setSmtpSecure(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      Use SSL/TLS (secure)
                    </label>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="smtp_user"
                    className="text-white/90 mb-1.5 block"
                  >
                    SMTP user (email)
                  </Label>
                  <Input
                    id="smtp_user"
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="e.g. you@yourdomain.com"
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="smtp_password"
                    className="text-white/90 mb-1.5 block"
                  >
                    SMTP password
                  </Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    placeholder={
                      hasSmtp
                        ? "Leave blank to keep current"
                        : "App password or account password"
                    }
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="current-password"
                  />
                  {hasSmtp && (
                    <p className="mt-1 text-xs text-white/50">
                      Leave blank to keep your existing password.
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="from_email"
                    className="text-white/90 mb-1.5 block"
                  >
                    From email (sender address)
                  </Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={smtpUser}
                    readOnly
                    placeholder={
                      signInEmail || "e.g. you@yourdomain.com"
                    }
                    className="bg-white/5 border-white/20 text-white read-only:cursor-default read-only:opacity-90"
                    aria-label="From email (same as SMTP user)"
                  />
                  <p className="mt-1 text-xs text-white/50">
                    Same as SMTP user (read-only).
                  </p>
                </div>

                {smtpMessage && (
                  <p
                    className={`text-sm ${
                      smtpMessage.type === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                    role="alert"
                  >
                    {smtpMessage.text}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={smtpSaving || !canSaveSmtp}
                >
                  {smtpSaving ? "Saving…" : "Save SMTP settings"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* IMAP Config Card */}
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">IMAP Config</CardTitle>
              <CardDescription className="text-white/70">
                Used to sync replies to your campaign emails. Replies are polled
                every 5 minutes and stored in the database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveImap} className="space-y-4">
                <div>
                  <Label
                    htmlFor="imap_host"
                    className="text-white/90 mb-1.5 block"
                  >
                    IMAP host (domain)
                  </Label>
                  <Input
                    id="imap_host"
                    type="text"
                    value={imapHost}
                    onChange={(e) => setImapHost(e.target.value)}
                    placeholder="e.g. imap.gmail.com or mail.yourdomain.com"
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="off"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="imap_port"
                      className="text-white/90 mb-1.5 block"
                    >
                      Port
                    </Label>
                    <Input
                      id="imap_port"
                      type="number"
                      min={1}
                      max={65535}
                      value={imapPort}
                      onChange={(e) => setImapPort(e.target.value)}
                      placeholder="993"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-white/90 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={imapSecure}
                        onChange={(e) => setImapSecure(e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-[#2563EB] focus:ring-[#2563EB]"
                      />
                      Use SSL/TLS (secure)
                    </label>
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="imap_user"
                    className="text-white/90 mb-1.5 block"
                  >
                    IMAP user (email)
                  </Label>
                  <Input
                    id="imap_user"
                    type="email"
                    value={imapUser}
                    onChange={(e) => setImapUser(e.target.value)}
                    placeholder="e.g. you@yourdomain.com"
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="imap_password"
                    className="text-white/90 mb-1.5 block"
                  >
                    IMAP password
                  </Label>
                  <Input
                    id="imap_password"
                    type="password"
                    value={imapPassword}
                    onChange={(e) => setImapPassword(e.target.value)}
                    placeholder={
                      hasImap
                        ? "Leave blank to keep current"
                        : "App password or account password"
                    }
                    className="bg-white/5 border-white/20 text-white"
                    autoComplete="current-password"
                  />
                  {hasImap && (
                    <p className="mt-1 text-xs text-white/50">
                      Leave blank to keep your existing password.
                    </p>
                  )}
                </div>

                {imapMessage && (
                  <p
                    className={`text-sm ${
                      imapMessage.type === "success"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                    role="alert"
                  >
                    {imapMessage.text}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={imapSaving || !canSaveImap}
                >
                  {imapSaving ? "Saving…" : "Save IMAP settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}
    </section>
  );
}