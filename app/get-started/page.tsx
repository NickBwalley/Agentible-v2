import { Header } from "@/components/landing/Header";
import { GetStartedForm } from "@/components/landing/GetStartedForm";

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-32 pb-24 px-6 max-w-md mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
          Get started
        </h1>
        <p className="mt-3 text-center text-white/70">
          Enter your email or sign in with Google.
        </p>
        <div className="mt-10">
          <GetStartedForm />
        </div>
      </section>
    </main>
  );
}
