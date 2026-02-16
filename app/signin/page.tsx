import { SectionPage } from "@/components/landing/SectionPage";

export default function SignInPage() {
  return (
    <SectionPage
      title="Login"
      description="Sign in to your Agentible account."
    >
      <div className="mt-8 max-w-md">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#2563EB] px-4 py-3 font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </SectionPage>
  );
}
