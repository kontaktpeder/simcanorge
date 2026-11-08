import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-10 md:py-14" style={{ background: "hsl(var(--paper))" }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-xl border border-black/10 p-5 md:p-6">
          <h3 className="font-display text-3xl text-[#071628] uppercase">Har du en Simca?</h3>
          <p className="font-sans text-base leading-relaxed text-[#1c1917]/75 mt-2 mb-4">
            Del historien om din klassiker med Simca-miljøet i Norge.
          </p>
          <Link to="/send-inn" className="btn-enamel-red">
            Send inn din bil
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-black/10 p-5 md:p-6">
          <h3 className="font-display text-3xl text-[#071628] uppercase">Trenger du deler?</h3>
          <p className="font-sans text-base leading-relaxed text-[#1c1917]/75 mt-2 mb-4">
            Bla i utvalget av deler og annonser.
          </p>
          <Link to="/markedsplass" className="btn-secondary">
            Markedsplass
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
