import { Header } from "@/components/landing/Header";
import { BookADemoCard } from "@/components/landing/BookADemoCard";

export default function BookADemoPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-28 pb-20 px-6 flex flex-col items-center">
        <BookADemoCard />
      </section>
    </main>
  );
}
