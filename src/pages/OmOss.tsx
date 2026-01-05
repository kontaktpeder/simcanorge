import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { Facebook, Heart, Users, Car, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

export default function OmOss() {
  return (
    <Layout>
      <PageHeader 
        title="OM OSS" 
        subtitle="Fordi disse bilene fortjente bedre" 
      />

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            
            {/* Intro */}
            <AnimatedSection>
              <p className="font-serif text-2xl md:text-3xl text-foreground/90 leading-relaxed mb-12">
                Simca Norge er opprettet fordi disse bilene nesten forsvant – og fordi noen mente de fortjente bedre.
              </p>
            </AnimatedSection>

            {/* Facebook History */}
            <AnimatedSection className="mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Facebook className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                    FRA FACEBOOK TIL NETTSTED
                  </h2>
                </div>
              </div>
              <div className="prose prose-xl max-w-none">
                <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-4">
                  Allerede i 2007 ble Facebook-gruppen Simca Norge etablert av noen få entusiaster. Gruppen har siden vært levende og aktiv, og har gjennom årene samlet over 1000 medlemmer. Her deles minner, bilder, teknisk kunnskap og entusiasme for et bilmerke som for mange har hatt en helt spesiell plass.
                </p>
                <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                  Samtidig har det lenge vært savnet noe mer.
                </p>
              </div>
            </AnimatedSection>

            {/* The Need */}
            <AnimatedSection className="mb-12">
              <div className="badge-frame bg-metal-blue p-8 md:p-10 rounded-xl text-white">
                <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-4">
                  Facebook egner seg godt for dialog, men gir begrensede muligheter for å vise frem bilene slik de fortjener. Bilder forsvinner fort i strømmen, og det har manglet et sted der norske Simca-biler kan presenteres ordentlig, inspirere nye eiere – og vekke interessen hos dem som kanskje bare husker bilene fra barndommen.
                </p>
                <p className="font-display text-2xl text-white">
                  Denne nettsiden er laget for å fylle nettopp det rommet.
                </p>
              </div>
            </AnimatedSection>

            {/* Mission */}
            <AnimatedSection className="mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <Car className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                    ET LEVENDE ARKIV
                  </h2>
                </div>
              </div>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                Simca Norge skal være et visuelt og levende arkiv der bilene får plass, historiene kan bevares, og entusiasmen kan vokse. Her kan både ferdig restaurerte biler og pågående prosjekter vises frem – til inspirasjon for andre.
              </p>
            </AnimatedSection>

            {/* Parts */}
            <AnimatedSection className="mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                    DELER OG RESTAURERING
                  </h2>
                </div>
              </div>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                I takt med at flere biler nå restaureres, har også behovet for deler økt. Simca Norge har fått tilgang til et omfattende bildellager, som formidles gjennom denne siden. Målet er å gjøre det enklere for eiere å finne riktige deler, holde bilene på veien – og senke terskelen for å sette i gang med restaurering.
              </p>
            </AnimatedSection>

            {/* Relationship with Facebook */}
            <AnimatedSection className="mb-12">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-muted rounded-xl">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl text-foreground mb-4">
                    UTFYLLER FELLESSKAPET
                  </h2>
                </div>
              </div>
              <div className="border-l-4 border-accent pl-6">
                <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-4">
                  Simca Norge er ikke ment å erstatte fellesskapet på Facebook, men å utfylle det.
                </p>
                <p className="font-serif text-xl md:text-2xl text-foreground/90 italic">
                  Facebook er møteplassen. Denne siden er utstillingsrommet, verktøykassen og inspirasjonskilden.
                </p>
              </div>
            </AnimatedSection>

            {/* Closing */}
            <AnimatedSection>
              <div className="text-center py-10 border-t border-border">
                <Heart className="w-12 h-12 text-accent mx-auto mb-6" />
                <p className="font-serif text-xl md:text-2xl text-foreground/80 leading-relaxed max-w-2xl mx-auto">
                  Alt drives av entusiasme, frivillig innsats og kjærlighet til et bilmerke som fortjener å bli sett – og brukt – også i dag.
                </p>
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link to="/biler" className="btn-enamel-blue">
              Se alle biler
            </Link>
            <Link to="/deler" className="btn-enamel-red">
              Finn deler
            </Link>
            <a 
              href="https://www.facebook.com/groups/1569119639997670" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-display text-lg uppercase tracking-wide text-foreground hover:text-accent transition-colors"
            >
              <Facebook className="w-5 h-5" />
              Besøk Facebook-gruppen
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
