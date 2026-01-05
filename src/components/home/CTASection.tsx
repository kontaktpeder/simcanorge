import { Link } from "react-router-dom";
import { Send, Wrench } from "lucide-react";

export function CTASection() {
  return (
    <section className="poster-section poster-section-red">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Send inn bil CTA */}
          <div className="border-chrome card-enamel bg-card text-foreground p-8 hover-lift transition-all">
            <Send className="w-12 h-12 text-accent mb-4" />
            <h3 className="headline-md mb-4">
              HAR DU EN SIMCA?
            </h3>
            <p className="text-lg mb-6 text-muted-foreground">
              Del historien om din franske klassiker med Simca-miljøet i Norge. 
              Vi vil gjerne høre fra deg!
            </p>
            <Link 
              to="/send-inn" 
              className="btn-enamel-red inline-flex"
            >
              Send inn din bil
              <Send className="w-5 h-5 ml-2" />
            </Link>
          </div>

          {/* Deler CTA */}
          <div className="border-chrome card-enamel bg-card text-foreground p-8 hover-lift transition-all">
            <Wrench className="w-12 h-12 text-primary mb-4" />
            <h3 className="headline-md mb-4">
              TRENGER DU DELER?
            </h3>
            <p className="text-lg mb-6 text-muted-foreground">
              Pappa sjekker hylla! Vi har samlet et utvalg deler til diverse 
              Simca-modeller. Ta en titt!
            </p>
            <Link 
              to="/deler" 
              className="btn-enamel-blue inline-flex"
            >
              Bla i deler
              <Wrench className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
