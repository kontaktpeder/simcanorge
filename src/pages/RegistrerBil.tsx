import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Car, Share2, Image as ImageIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME } from "@/config/site";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

const BENEFITS = [
  { icon: Car, title: "Profesjonell bilside", text: "En egen side bilen din fortjener." },
  { icon: Share2, title: "Delbar lenke", text: "Del med venner, kjøpere og klubben." },
  { icon: ImageIcon, title: "Bilder og historie samlet", text: "Alt om bilen på ett sted." },
  { icon: Sparkles, title: "Gratis å starte", text: "Kom i gang på under 2 minutter." },
];

export default function RegistrerBil() {
  const { user } = useAuth();
  const primaryHref = user ? "/dashboard/opprett-bil" : "/send-inn";

  return (
    <div className="min-h-[100svh] bg-[#070b10] text-white">
      <Helmet>
        <title>Legg inn bilen din – {SITE_NAME}</title>
        <meta
          name="description"
          content="Gi bilen din en skikkelig plass på nett. Legg inn bilder, historie og info – og få en profesjonell bilside du kan dele."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content={`Legg inn bilen din – ${SITE_NAME}`} />
        <meta
          property="og:description"
          content="Gi bilen din en skikkelig plass på nett. Profesjonell bilside du kan dele."
        />
      </Helmet>

      {/* HERO */}
      <section className="relative w-full h-[100svh] min-h-[100svh] overflow-hidden">
        {/* Video bg */}
        <div className="absolute inset-0">
          <iframe
            src="https://player.vimeo.com/video/1185602288?background=1&autoplay=1&loop=1&muted=1&autopause=0&controls=0&title=0&byline=0&portrait=0&badge=0&app_id=58479"
            title="Bilgarasje hero"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: "max(100vw, 177.78vh)",
              height: "max(56.25vw, 100vh)",
              minWidth: "100%",
              minHeight: "100%",
            }}
            loading="eager"
          />
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#070b10]" />
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-overlay pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, rgba(52,234,184,0.25), transparent 60%)",
          }}
        />

        {/* Content */}
        <div
          className="relative z-10 h-full flex flex-col px-5 pt-[max(env(safe-area-inset-top),1.25rem)] pb-[max(env(safe-area-inset-bottom),1.5rem)]"
        >
          {/* Top label */}
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center group -my-2"
              aria-label="Bilgarasje.no"
            >
              <img
                src={bilgarasjeLogo}
                alt="Bilgarasje.no"
                className="h-24 w-auto transition-all duration-300 group-hover:opacity-80"
                style={{ filter: 'brightness(1.8) invert(1)', opacity: 0.7 }}
              />
            </Link>
            <Link
              to="/biler"
              className="text-[11px] uppercase tracking-[0.18em] text-white/60 hover:text-white transition"
              style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
            >
              Utforsk
            </Link>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Headline */}
          <div className="space-y-5 animate-fade-in">
            <span
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] uppercase tracking-[0.22em] font-bold text-white/90"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              <Sparkles className="w-3 h-3 text-[#34eab8]" />
              Ny på Bilgarasje
            </span>

            <h1
              className="text-[40px] leading-[1.02] sm:text-[56px] font-bold tracking-tight text-white"
              style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
            >
              Gi bilen din en
              <br />
              <span className="text-[#34eab8]">skikkelig plass</span>
              <br />
              på nett.
            </h1>

            <p className="text-[15px] sm:text-[17px] leading-relaxed text-white/75 max-w-[34ch]">
              Legg inn bilen din med bilder, historie og info — og få en profesjonell bilside du kan dele med andre.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to={primaryHref}
                className="group relative inline-flex items-center justify-center gap-2 w-full h-14 rounded-xl bg-[#34eab8] text-[#062018] font-bold text-[15px] uppercase tracking-[0.14em] shadow-[0_10px_40px_-10px_rgba(52,234,184,0.7)] active:scale-[0.98] transition"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                Legg inn bil
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/biler"
                className="inline-flex items-center justify-center w-full h-12 rounded-xl border border-white/20 bg-white/[0.04] backdrop-blur-md text-white text-[13px] uppercase tracking-[0.16em] font-semibold hover:bg-white/[0.08] active:scale-[0.98] transition"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                Utforsk biler
              </Link>
            </div>

            {/* Scroll cue */}
            <div className="flex justify-center pt-3">
              <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="relative px-5 py-16 sm:py-24 bg-[#070b10]">
        <div className="max-w-md sm:max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p
              className="text-[11px] uppercase tracking-[0.25em] text-[#34eab8] font-bold mb-3"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              Hvorfor Bilgarasje
            </p>
            <h2
              className="text-2xl sm:text-3xl font-bold text-white"
              style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
            >
              Alt bilen din fortjener.
            </h2>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-[#34eab8]/30 transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#34eab8]/10 border border-[#34eab8]/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-[#34eab8]" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[14px] font-bold text-white mb-0.5"
                      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
                    >
                      {b.title}
                    </p>
                    <p className="text-[13px] text-white/60 leading-relaxed">{b.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Bottom CTA */}
          <div className="mt-10 text-center">
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center gap-2 h-14 px-8 rounded-xl bg-[#34eab8] text-[#062018] font-bold text-[14px] uppercase tracking-[0.14em] shadow-[0_10px_40px_-10px_rgba(52,234,184,0.7)] active:scale-[0.98] transition"
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            >
              Kom i gang nå
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-4 text-[12px] text-white/40">Gratis · Tar under 2 minutter</p>
          </div>
        </div>
      </section>
    </div>
  );
}
