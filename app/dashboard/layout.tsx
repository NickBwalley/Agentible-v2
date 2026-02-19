"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { useUser } from "@/lib/hooks/use-user";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0f1419]">
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <span className="text-white/60">Loading…</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      {children}
    </main>
  );
}
