"use client";

const CALENDLY_URL = "https://calendly.com/nickbwalley/agentible-discovery-call";

export function BookADemoCard() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/10">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Book a discovery call</h1>
          <p className="mt-2 text-white/70">
            Pick a time that works for you. We&apos;ll walk you through Agentible and answer your questions.
          </p>
        </div>
        <div className="relative w-full min-h-[700px] md:min-h-[750px]">
          <iframe
            title="Schedule a discovery call with Agentible"
            src={CALENDLY_URL}
            className="absolute inset-0 w-full h-full min-h-[700px] md:min-h-[750px] border-0"
            allowFullScreen
          />
        </div>
        <div className="p-4 md:p-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
          <span>Powered by</span>
          <a
            href={CALENDLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#2563EB] hover:underline"
          >
            Calendly
          </a>
        </div>
      </div>
    </div>
  );
}
