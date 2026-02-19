import { Header } from "@/components/landing/Header";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-28 pb-20 px-6 max-w-md mx-auto">
        <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl p-8">
          <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
          <p className="mt-2 text-white/70">Enter your work email and we&apos;ll send you a reset link.</p>
          <form className="mt-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Work Email</label>
              <input
                type="email"
                placeholder="Enter your work-email"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
            >
              Send reset link
            </button>
          </form>
          <p className="mt-6 text-center">
            <Link href="/signin" className="text-sm text-[#2563EB] hover:underline">Back to Login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
