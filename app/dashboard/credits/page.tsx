"use client";

import Link from "next/link";

export default function CreditsPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <div className="mb-8">
        <Link href="/" className="text-sm text-white/70 hover:text-white">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Credit Tracking</h1>
        <p className="mt-1 text-sm text-white/60">
          View your credit balance and usage.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-4">
          <span className="text-white/80">Available credits</span>
          <span className="text-xl font-semibold text-white">600</span>
        </div>
        <p className="mt-4 text-sm text-white/50">
          Credit tracking details will be available in a future update.
        </p>
      </div>
    </section>
  );
}
