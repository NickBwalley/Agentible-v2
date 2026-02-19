"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/profile");
  }, [router]);
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <span className="text-white/60">Redirecting…</span>
    </div>
  );
}
