import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { SeoHead } from "@/components/seo";

const inter = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

const TYPE_LINE: Record<string, string> = {
  story: "Historien din er sendt inn.",
  model: "Forslaget ditt er mottatt.",
  correction: "Endringsforslaget ditt er sendt inn.",
};

export default function BidragSendt() {
  const [params] = useSearchParams();
  const carSlug = params.get("car");
  const steward = params.get("steward");
  const type = params.get("type") ?? "";

  const lead = steward
    ? `Bidraget ditt er sendt til ${steward}.`
    : TYPE_LINE[type] ?? "Bidraget ditt er sendt inn.";

  return (
    <Layout>
      <SeoHead title="Takk for bidraget – Bilgarasje.no" description="Bidraget ditt er sendt inn." noindex />
      <section className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div
          className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm"
          style={inter}
        >
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-600" strokeWidth={1.75} />
          <h1 className="text-[22px] sm:text-[24px] font-bold text-neutral-900 mb-2">
            Takk!
          </h1>
          <p className="text-[15px] text-neutral-700 mb-6 leading-relaxed">
            {lead}
          </p>
          {carSlug ? (
            <Link
              to={`/biler/${carSlug}`}
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
              style={{ backgroundColor: "#2b2b2b" }}
            >
              Tilbake til bilen
            </Link>
          ) : (
            <Link
              to="/biler"
              className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-sm font-semibold text-white hover:brightness-110 transition"
              style={{ backgroundColor: "#2b2b2b" }}
            >
              Tilbake til biler
            </Link>
          )}
        </div>
      </section>
    </Layout>
  );
}
