import { Header } from "@/components/landing/Header";
import { LoginCard } from "@/components/landing/LoginCard";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-28 pb-20 px-6 flex flex-col items-center">
        <LoginCard />
      </section>
    </main>
  );
}
