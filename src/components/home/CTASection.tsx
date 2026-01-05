import { Link } from "react-router-dom";
import { Send, Wrench, ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="poster-section poster-section-red relative overflow-hidden">
      {/* Subtle texture */}
      <div className="absolute inset-0 stripes-diagonal opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Send inn bil CTA */}
          <div className="border-chrome card-enamel bg-card text-foreground p-8 lg:p-10 hover-lift transition-all group">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6">
              <Send className="w-8 h-8 text-accent" />
            </div>
            <h3 className="headline-md mb-4">
              HAR DU EN SIMCA?
            </h3>
            <p className="text-lg mb-8 text-muted-foreground leading-relaxed">
              Del historien om din franske klassiker med Simca-miljøet i Norge. 
              Vi vil gjerne høre fra deg og vise fram bilen din!
            </p>
            <Link 
              to="/send-inn" 
              className="btn-enamel-red inline-flex group/btn text-lg px-8 py-4"
            >
              <span>Send inn din bil</span>
              <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Deler CTA */}
          <div className="border-chrome card-enamel bg-card text-foreground p-8 lg:p-10 hover-lift transition-all group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Wrench className="w-8 h-8 text-primary" />
            </div>
            <h3 className="headline-md mb-4">
              TRENGER DU DELER?
            </h3>
            <p className="text-lg mb-8 text-muted-foreground leading-relaxed">
              Pappa sjekker hylla! Vi har samlet et utvalg deler til diverse 
              Simca-modeller. Ta en titt og send en forespørsel!
            </p>
            <Link 
              to="/deler" 
              className="btn-enamel-blue inline-flex group/btn text-lg px-8 py-4"
            >
              <span>Bla i deler</span>
              <ArrowRight className="w-5 h-5 ml-3 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
