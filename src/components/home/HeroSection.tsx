import { Link } from "react-router-dom";
import { ArrowRight, Car } from "lucide-react";

export function HeroSection() {
  return (
    <section className="poster-section poster-section-blue relative overflow-hidden">
      {/* Decorative stripes */}
      <div className="absolute inset-0 stripes-diagonal opacity-10" />
      
      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <span className="inline-block font-serif italic text-xl mb-4 opacity-90">
              Bienvenue chez
            </span>
            <h1 className="headline-xl mb-6 text-shadow-retro">
              SIMCA<br />NORGE
            </h1>
            <p className="text-xl md:text-2xl font-light mb-8 max-w-lg mx-auto lg:mx-0">
              Din kilde til franske klassikere, deler og historier fra Simca-entusiaster i Norge.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/biler" className="btn-retro bg-accent">
                Se alle biler
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link 
                to="/deler" 
                className="btn-retro bg-primary-foreground text-primary border-primary-foreground"
              >
                Finn deler
                <Car className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>

          {/* Featured Car Placeholder */}
          <div className="relative">
            <div className="bg-card/10 backdrop-blur-sm rounded-lg p-8 border-4 border-primary-foreground/30">
              <div className="aspect-[4/3] bg-primary-foreground/20 rounded flex items-center justify-center">
                <div className="text-center">
                  <Car className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="font-display text-2xl opacity-75">UKENS BIL</p>
                  <p className="font-serif italic opacity-60">Kommer snart...</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="font-display text-xl">1967 SIMCA 1000</p>
                <p className="font-serif italic opacity-80">En perle fra Poissy</p>
              </div>
            </div>
            
            {/* Decorative badge */}
            <div className="absolute -top-4 -right-4 bg-accent text-accent-foreground px-4 py-2 font-display text-lg rotate-12 border-2 border-foreground">
              FEATURED
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
