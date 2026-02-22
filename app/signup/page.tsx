import { Header } from "@/components/landing/Header";
import { SignupCard } from "@/components/landing/SignupCard";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-28 pb-20 px-6 flex flex-col items-center">
        <SignupCard />
      </section>
    </main>
  );
}
