import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <Hero />
      <Pricing />
    </main>
  );
}
