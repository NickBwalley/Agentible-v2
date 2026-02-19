export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="px-6 py-24 max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-16">
        How It Works
      </h2>
      <div className="grid gap-12 md:grid-cols-3">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2563EB]/20 text-[#2563EB] text-2xl font-bold mb-4">
            1
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Define your ICP and offer
          </h3>
          <p className="text-white/70">
            We focus outreach only where real buying intent can exist.
          </p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2563EB]/20 text-[#2563EB] text-2xl font-bold mb-4">
            2
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Launch targeted outbound campaigns
          </h3>
          <p className="text-white/70">
            Clean data, inbox-safe sending, and relevant messaging.
          </p>
        </div>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#2563EB]/20 text-[#2563EB] text-2xl font-bold mb-4">
            3
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">
            Turn replies into booked meetings
          </h3>
          <p className="text-white/70">
            Track qualified responses and measure real pipeline impact.
          </p>
        </div>
      </div>
    </section>
  );
}
