import { Factory, Calendar, Trophy } from "lucide-react";

const funFacts = [
  {
    icon: Factory,
    title: "Poissy",
    fact: "Simca produserte biler fra 1934 til 1978 i den franske byen Poissy.",
  },
  {
    icon: Trophy,
    title: "Rallyvinner",
    fact: "Simca 1000 Rallye var en populær konkurrent i europeisk rally på 70-tallet.",
  },
  {
    icon: Calendar,
    title: "1958",
    fact: "Chrysler kjøpte majoriteten av Simca og skapte «Simca-Chrysler».",
  },
];

export function FunFactsSection() {
  return (
    <section className="py-12 md:py-16" style={{ background: "hsl(var(--paper))" }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <h2 className="font-display text-4xl md:text-5xl uppercase text-[#071628] text-center mb-8">
          Visste du at?
        </h2>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {funFacts.map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-black/10 p-5 md:p-6">
              <item.icon className="w-6 h-6 text-[#C10D0D] mb-3" />
              <h3 className="font-display text-2xl uppercase text-[#071628]">{item.title}</h3>
              <p className="font-sans text-base leading-relaxed text-[#1c1917]/75 mt-2">{item.fact}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
