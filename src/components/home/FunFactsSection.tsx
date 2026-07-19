import { Factory, Calendar, Trophy } from "lucide-react";

const funFacts = [
  {
    icon: Factory,
    title: "POISSY",
    fact: "Simca produserte biler fra 1934 til 1978 i den franske byen Poissy.",
  },
  {
    icon: Trophy,
    title: "RALLYVINNER",
    fact: "Simca 1000 Rallye var en populær konkurrent i europeisk rally på 70-tallet.",
  },
  {
    icon: Calendar,
    title: "1958",
    fact: "Chrysler kjøpte majoriteten av Simca og skapte 'Simca-Chrysler'.",
  },
];

export function FunFactsSection() {
  return (
    <section className="poster-section bg-secondary">
      <div className="container mx-auto">
        <h2 className="headline-md text-center mb-12">
          VISSTE DU AT...?
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {funFacts.map((item, index) => (
            <div 
              key={index}
              className="retro-card text-center hover-lift"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-3xl text-accent mb-3">
                {item.title}
              </h3>
              <p className="text-muted-foreground">
                {item.fact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
