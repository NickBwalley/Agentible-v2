"use client";

import Link from "next/link";

export default function PaymentHistoryPage() {
  return (
    <section className="mx-auto max-w-2xl px-6 pt-28 pb-20">
      <div className="mb-8">
        <Link href="/" className="text-sm text-white/70 hover:text-white">
          ← Back
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Payment History</h1>
        <p className="mt-1 text-sm text-white/60">
          View and download past invoices.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-xl text-center">
        <p className="text-white/70">No payments yet.</p>
        <p className="mt-2 text-sm text-white/50">
          Your payment history will appear here once you make a purchase.
        </p>
      </div>
    </section>
  );
}
