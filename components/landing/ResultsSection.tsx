export function ResultsSection() {
  return (
    <section className="px-6 py-24 bg-white/5">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">
          What success looks like
        </h2>
        <div className="grid gap-8 md:grid-cols-3 mb-8">
          <div>
            <div className="text-3xl font-bold text-[#2563EB] mb-2">5–20</div>
            <p className="text-white/80">qualified meetings per 1,000 delivered emails</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2563EB] mb-2">Stable</div>
            <p className="text-white/80">inbox placement across campaigns</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#2563EB] mb-2">Clear</div>
            <p className="text-white/80">cost per meeting you can scale confidently</p>
          </div>
        </div>
        <p className="text-sm text-white/60">
          Performance varies by niche and offer. We measure what is real.
        </p>
      </div>
    </section>
  );
}
