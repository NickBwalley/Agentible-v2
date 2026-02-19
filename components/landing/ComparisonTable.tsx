const tools = [
  { name: "Agentible", research: "Deep", personalization: "Yes", revops: "Yes" },
  { name: "Smartlead", research: "None", personalization: "Templates", revops: "No" },
  { name: "Instantly", research: "None", personalization: "Templates", revops: "No" },
  { name: "11x", research: "Shallow", personalization: "Generic", revops: "No" },
  { name: "Artisan", research: "Shallow", personalization: "Generic", revops: "No" },
  { name: "Clari", research: "N/A", personalization: "N/A", revops: "Yes (no outreach)" },
  { name: "Gong", research: "N/A", personalization: "N/A", revops: "Yes (no outreach)" },
];

export function ComparisonTable() {
  return (
    <section className="px-6 py-24 bg-white/[0.02]">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
          Why teams switch from Smartlead, 11x, and others
        </h2>
        <p className="mt-3 text-center text-white/70 max-w-xl mx-auto">
          Volume tools send more. Autonomous agents lose control. We combine both sides.
        </p>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-4 px-4 text-left text-sm font-medium text-white/70"></th>
                <th className="py-4 px-4 text-center text-sm font-medium text-[#2563EB]">Agentible</th>
                <th className="py-4 px-4 text-center text-sm font-medium text-white/70">Smartlead</th>
                <th className="py-4 px-4 text-center text-sm font-medium text-white/70">11x</th>
                <th className="py-4 px-4 text-center text-sm font-medium text-white/70">Clari/Gong</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/90">Research depth</td>
                <td className="py-4 px-4 text-center text-[#2563EB]">Deep</td>
                <td className="py-4 px-4 text-center text-white/50">—</td>
                <td className="py-4 px-4 text-center text-white/50">Shallow</td>
                <td className="py-4 px-4 text-center text-white/50">—</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/90">Personalization</td>
                <td className="py-4 px-4 text-center text-[#2563EB]">Research-driven</td>
                <td className="py-4 px-4 text-center text-white/50">Templates</td>
                <td className="py-4 px-4 text-center text-white/50">Generic</td>
                <td className="py-4 px-4 text-center text-white/50">—</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/90">RevOps / Attribution</td>
                <td className="py-4 px-4 text-center text-[#2563EB]">Yes</td>
                <td className="py-4 px-4 text-center text-white/50">No</td>
                <td className="py-4 px-4 text-center text-white/50">No</td>
                <td className="py-4 px-4 text-center text-white/50">Yes (no outreach)</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-4 px-4 text-sm text-white/90">Pipeline + analytics</td>
                <td className="py-4 px-4 text-center text-[#2563EB]">Yes</td>
                <td className="py-4 px-4 text-center text-white/50">No</td>
                <td className="py-4 px-4 text-center text-white/50">No</td>
                <td className="py-4 px-4 text-center text-white/50">Analytics only</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
