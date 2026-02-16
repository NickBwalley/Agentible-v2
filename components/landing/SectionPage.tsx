import { Header } from "./Header";

interface SectionPageProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function SectionPage({ title, description, children }: SectionPageProps) {
  return (
    <main className="min-h-screen bg-[#0f1419]">
      <Header />
      <section className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-white">{title}</h1>
        {description && (
          <p className="mt-4 text-lg text-white/80">{description}</p>
        )}
        {children}
      </section>
    </main>
  );
}
