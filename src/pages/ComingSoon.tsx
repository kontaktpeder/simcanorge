import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Sparkles, ArrowLeft } from "lucide-react";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export default function ComingSoon() {
  return (
    <Layout>
      <Helmet>
        <title>Kommer snart — Bilgarasje.no</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 py-16" style={{ background: "#070b10" }}>
        <div
          className="max-w-lg w-full rounded-2xl border border-white/[0.08] p-10 text-center"
          style={{ background: "linear-gradient(180deg, hsl(215 25% 11%) 0%, hsl(215 25% 9%) 100%)" }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-6" style={{ background: "rgba(45,212,168,0.12)" }}>
            <Sparkles className="w-6 h-6 text-[#2dd4a8]" />
          </div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#2dd4a8]/70 mb-3" style={oswald}>
            Kommer snart
          </p>
          <h1 className="text-[1.8rem] sm:text-[2.2rem] uppercase tracking-[0.02em] text-white font-bold mb-3" style={chakra}>
            Vi bygger dette nå
          </h1>
          <p className="text-[13px] text-white/50 mb-8 leading-relaxed" style={oswald}>
            Vi lanserer Bilgarasje stegvis. Akkurat nå fokuserer vi på bilene og historiene.
            Resten åpner snart — følg med!
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link
              to="/biler"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[12px] tracking-[0.1em] uppercase font-bold text-[#070b10] transition-all hover:scale-[1.03]"
              style={{ ...chakra, background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 100%)", boxShadow: "0 0 20px rgba(45,212,168,0.25)" }}
            >
              Utforsk biler
            </Link>
            <Link
              to="/legg-til-bil"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[12px] tracking-[0.1em] uppercase font-bold text-white/70 border border-white/[0.15] hover:border-white/[0.3] hover:text-white transition-all"
              style={chakra}
            >
              Legg inn bilen din
            </Link>
          </div>
          <Link
            to="/garasje"
            className="inline-flex items-center gap-1.5 mt-6 text-[11px] tracking-[0.15em] uppercase text-white/30 hover:text-white/60 transition-colors"
            style={oswald}
          >
            <ArrowLeft className="w-3 h-3" /> Til min garasje
          </Link>
        </div>
      </div>
    </Layout>
  );
}
