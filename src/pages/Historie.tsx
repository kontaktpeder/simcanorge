import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { useInView } from "@/hooks/useInView";
import { Calendar, MapPin, Car, History, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function TimelineItem({ year, title, children }: { year: string; title: string; children: React.ReactNode }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`relative pl-8 md:pl-12 pb-12 border-l-2 border-accent/30 last:border-l-0 last:pb-0 transition-all duration-700 ${isInView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
    >
      <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] rounded-full bg-accent shadow-lg" />
      <span className="font-display text-accent text-lg">{year}</span>
      <h3 className="font-display text-2xl md:text-3xl text-foreground mt-1 mb-4">{title}</h3>
      <div className="text-lg md:text-xl text-foreground/80 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function Historie() {
  return (
    <Layout>
      <PageHeader 
        title="HISTORIE" 
        subtitle="Fra 1934 til i dag – historien om et bilmerke med sjel" 
      />

      {/* Intro */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <History className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground">
                    SIMCA – ET MERKE MED PERSONLIGHET
                  </h2>
                </div>
              </div>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-6">
                Bilmerket Simca ble grunnlagt i Frankrike i 1934 og fikk raskt en viktig rolle i europeisk bilindustri. Simca ble kjent for å lage moderne, praktiske og rimelige biler – ofte med tekniske løsninger som lå litt foran sin tid.
              </p>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                Gjennom flere tiår lanserte merket en rekke modeller som ble populære både i Frankrike og i mange andre europeiske land, også i Norge.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection className="mb-12">
              <h2 className="font-display text-3xl md:text-4xl text-foreground text-center mb-4">
                TIDSLINJE
              </h2>
              <p className="text-center text-foreground/60 font-serif italic text-lg">
                Viktige øyeblikk i Simcas historie
              </p>
            </AnimatedSection>

            <div className="mt-12">
              <TimelineItem year="1934" title="Grunnleggelsen">
                <p>Simca (Société Industrielle de Mécanique et Carrosserie Automobile) grunnlegges i Frankrike.</p>
              </TimelineItem>

              <TimelineItem year="1950–60-tallet" title="Gullalderen">
                <p>
                  Etter krigen vokste Simca betydelig. Modeller som Aronde-serien og senere 1000 og 1100 ble kjent for god plassutnyttelse, kjøreegenskaper og et særpreg som skilte dem fra både tyske og britiske konkurrenter.
                </p>
                <p className="mt-4 font-serif italic text-foreground/70">
                  Simca var aldri et luksusmerke – men bilene hadde personlighet, og de ble brukt av vanlige folk.
                </p>
              </TimelineItem>

              <TimelineItem year="1970-tallet" title="Chrysler-perioden">
                <p>
                  Simca ble en del av Chrysler Europe. Merket fortsatte å produsere biler, men begynte gradvis å miste sin egenart.
                </p>
              </TimelineItem>

              <TimelineItem year="1978" title="Peugeot overtar">
                <p>
                  Peugeot kjøpte Chrysler Europe. Under Peugeot ble Simca-navnet gradvis faset ut, og bilene ble i stedet solgt under navnet Talbot. Merkets særpreg ble svakere.
                </p>
              </TimelineItem>

              <TimelineItem year="1987" title="Produksjonen opphører">
                <p>
                  Produksjonen av Simca-baserte biler opphørte. En bilhistorie som hadde vart i over 50 år, var slutt.
                </p>
              </TimelineItem>
            </div>
          </div>
        </div>
      </section>

      {/* Simca i Norge */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-accent/10 rounded-xl">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground">
                    SIMCA I NORGE
                  </h2>
                </div>
              </div>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-6">
                I Norge var Simca aldri blant de største bilmerkene, men mange biler fant likevel veien hit – særlig på 1960- og 70-tallet. Etter at produksjonen stoppet, forsvant bilene raskt fra veiene.
              </p>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed">
                En kombinasjon av begrenset rustbeskyttelse, økende bruk av veisalt og lav annenhåndsverdi førte til at mange biler ble vraket tidlig.
              </p>
            </AnimatedSection>

            <AnimatedSection className="mt-12">
              <div className="badge-frame bg-muted/30 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                  <span className="font-display text-xl text-accent">1996</span>
                </div>
                <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-4">
                  Vrakpanten i Norge ble kraftig økt for å få eldre og slitne biler ut av trafikken. For Simca og Talbot ble dette et avgjørende vendepunkt.
                </p>
                <p className="font-display text-xl text-foreground">
                  Det meste av det som fortsatt rullet, forsvant i løpet av kort tid.
                </p>
                <p className="text-foreground/70 mt-4 font-serif italic">
                  Kun et lite antall biler ble reddet og satt bort – ofte i garasjer, låver og uthus.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Gjenoppdagelsen */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <div className="flex items-start gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-foreground">
                    GJENOPPDAGELSEN
                  </h2>
                </div>
              </div>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-6">
                Utover 2000-tallet begynte en forsiktig gjenoppdagelse. Flere biler dukket opp igjen etter mange år i dvale, og interessen blant entusiaster vokste.
              </p>
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed mb-6">
                I dag finnes det igjen et lite, men engasjert miljø rundt Simca i Norge. Noen biler er ferdig restaurert, andre er midt i prosessen – og flere venter fortsatt på sin tur.
              </p>
              <div className="border-l-4 border-accent pl-6 mt-8">
                <p className="font-serif text-xl md:text-2xl text-foreground/90 italic">
                  Simca-historien i Norge er derfor ikke avsluttet. Den skrives fortsatt, bil for bil.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Outro */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimatedSection>
              <Car className="w-12 h-12 text-accent mx-auto mb-6" />
              <p className="font-serif text-xl md:text-2xl text-foreground/80 leading-relaxed mb-8">
                Denne siden er ment å gi et overblikk over merkets bakgrunn og utvikling. Historiene, bilene og menneskene bak lever videre – og kan oppleves andre steder på nettstedet.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/biler" className="btn-enamel-blue">
                  Se bilene
                </Link>
                <Link to="/om-oss" className="btn-enamel-red">
                  Om Simca Norge
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}
