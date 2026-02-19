"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/use-user";
import { getAvatarUrl } from "@/lib/avatar";
import { Button } from "@/components/ui/Button";

export default function ProfileSettingsPage() {
  const { user, profile, loading } = useUser();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("users")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Profile updated." });
  };

  if (loading || !user) {
    return null;
  }

  const avatarUrl = getAvatarUrl(profile?.avatar_url ?? null);

  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-white/70 hover:text-white"
        >
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Profile Settings</h1>
        <p className="mt-1 text-sm text-white/60">
          Update your basic information.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <div className="flex flex-col items-center border-b border-white/10 pb-6">
          <span className="relative flex h-24 w-24 overflow-hidden rounded-full border border-white/20">
            <Image
              src={avatarUrl}
              alt=""
              width={96}
              height={96}
              className="object-cover"
            />
          </span>
          <p className="mt-3 text-sm text-white/60">Avatar uses default image. Upload coming soon.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Email</label>
            <input
              type="email"
              value={profile?.email ?? ""}
              readOnly
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white/60 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-white/50">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 555 000 0000"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">Subscription</label>
            <p className="rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white/80 capitalize">
              {profile?.subscription ?? "basic"}
            </p>
          </div>
          {message && (
            <p
              className={`text-sm ${message.type === "success" ? "text-emerald-400" : "text-red-400"}`}
              role="alert"
            >
              {message.text}
            </p>
          )}
          <Button type="submit" variant="primary" size="md" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </div>
    </section>
  );
}
