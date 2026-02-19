"use client";

import { Header } from "@/components/landing/Header";
import { useEffect } from "react";

export default function BookADemoPage() {
  useEffect(() => {
    // Load Calendly CSS
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Load Calendly widget script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingLink = document.querySelector('link[href="https://assets.calendly.com/assets/external/widget.css"]');
      if (existingLink) {
        document.head.removeChild(existingLink);
      }
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Book a Demo
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Schedule a discovery call to see how Agentible can help you generate predictable qualified meetings from cold email.
            </p>
          </div>

          {/* Calendly Embed */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl">
            <div
              className="calendly-inline-widget"
              data-url="https://calendly.com/nickbwalley/agentible-discovery-call"
              style={{ minWidth: "320px", height: "700px" }}
            />
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-white/60">
              Questions?{" "}
              <a
                href="mailto:support@agentible.dev"
                className="text-[#2563EB] hover:underline"
              >
                Contact us
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
