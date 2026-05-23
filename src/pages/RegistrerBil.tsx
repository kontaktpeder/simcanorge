import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SeoHead, SEO_COPY } from "@/components/seo";
import { ArrowRight, Car, Share2, Image as ImageIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SITE_NAME } from "@/config/site";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

// Vegvesen-light palette
const VV_BG = "#f3f3f3";
const VV_YELLOW = "#fcc419";
const VV_YELLOW_SOFT = "#fff4d1";
const VV_ORANGE = "#ff8a00";
const VV_DARK = "#2b2b2b";
const inter = "'Inter', system-ui, -apple-system, sans-serif";

const BENEFITS = [
  { icon: Car, title: "Profesjonell bilside", text: "En egen side bilen din fortjener." },
  { icon: Share2, title: "Delbar lenke", text: "Del med venner, kjøpere og klubben." },
  { icon: ImageIcon, title: "Bilder og historie samlet", text: "Alt om bilen på ett sted." },
  { icon: Sparkles, title: "Gratis å starte", text: "Kom i gang på under 2 minutter." },
];

export default function RegistrerBil() {
  const { user } = useAuth();
  const primaryHref = "/legg-til-bil";

  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const videoId = isDesktop ? "1185630100" : "1185602288";
  const videoSize = isDesktop
    ? { width: "max(100vw, 133.33vh)", height: "max(75vw, 100vh)" }
    : { width: "max(100vw, 177.78vh)", height: "max(56.25vw, 100vh)" };

  return (
    <div className="min-h-[100svh]" style={{ background: VV_BG, color: VV_DARK, fontFamily: inter }}>
      <SeoHead {...SEO_COPY.onboarding} />
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://player.vimeo.com" crossOrigin="" />
        <link rel="preconnect" href="https://i.vimeocdn.com" crossOrigin="" />
        <link rel="preconnect" href="https://f.vimeocdn.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        <link rel="dns-prefetch" href="https://i.vimeocdn.com" />
        <link rel="dns-prefetch" href="https://f.vimeocdn.com" />
      </Helmet>

      {/* TOPBAR */}
      <header
        className="sticky top-0 z-30 bg-white border-b"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        {/* Orange progress stripe */}
        <div className="h-1 w-full" style={{ background: VV_ORANGE }} />
        <div className="max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-16 h-16 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center -my-2" aria-label="Bilgarasje.no">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-12 lg:h-14 w-auto"
              style={{ filter: "contrast(1.05)" }}
            />
          </Link>
          <div className="flex items-center gap-3 lg:gap-4">
            <Link
              to="/biler"
              className="text-[11px] lg:text-[12px] uppercase tracking-[0.18em] font-semibold text-neutral-500 hover:text-neutral-900 transition"
              style={{ fontFamily: inter }}
            >
              Utforsk
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-full text-[11px] lg:text-[12px] uppercase tracking-[0.18em] font-semibold transition"
              style={{
                background: VV_DARK,
                color: VV_YELLOW,
                fontFamily: inter,
              }}
            >
              Logg inn
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative px-5 sm:px-10 lg:px-16 pt-6 lg:pt-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm"
               style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            {/* Video bg */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9] bg-[#0b0b0b]">
              <iframe
                key={videoId}
                src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&muted=1&autopause=0&controls=0&title=0&byline=0&portrait=0&badge=0&dnt=1&quality=720p&app_id=58479`}
                title="Bilgarasje hero"
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={() => setVideoLoaded(true)}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-500 ${
                  videoLoaded ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  width: videoSize.width,
                  height: videoSize.height,
                  minWidth: "100%",
                  minHeight: "100%",
                }}
                loading="eager"
              />
              {/* Soft dark overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

              {/* Content overlay */}
              <div className="absolute inset-0 flex items-end">
                <div className="w-full p-6 sm:p-10 lg:p-14 max-w-[720px]">
                  <span
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] lg:text-[11px] uppercase tracking-[0.22em] font-bold"
                    style={{
                      background: VV_YELLOW,
                      color: VV_DARK,
                      fontFamily: inter,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Ny på Bilgarasje
                  </span>

                  <h1
                    className="mt-5 text-[36px] leading-[1.05] sm:text-[52px] lg:text-[72px] font-extrabold tracking-tight text-white"
                    style={{ fontFamily: inter }}
                  >
                    Gi bilen din en
                    <br />
                    <span style={{ color: VV_YELLOW }}>skikkelig plass</span>
                    <br />
                    på nett.
                  </h1>

                  <p className="mt-4 text-[14px] sm:text-[16px] lg:text-[18px] leading-relaxed text-white/85 max-w-[46ch]">
                    Legg inn bilen din med bilder, historie og info — og få en profesjonell bilside du kan dele med andre.
                  </p>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      to={primaryHref}
                      className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:px-8 h-12 lg:h-14 rounded-full font-bold text-[14px] uppercase tracking-[0.14em] active:scale-[0.98] hover:brightness-105 transition"
                      style={{
                        background: VV_YELLOW,
                        color: VV_DARK,
                        fontFamily: inter,
                      }}
                    >
                      Legg inn bil
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      to="/biler"
                      className="inline-flex items-center justify-center w-full sm:w-auto sm:px-8 h-12 lg:h-14 rounded-full text-[13px] uppercase tracking-[0.16em] font-semibold transition border border-white/40 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                      style={{ fontFamily: inter }}
                    >
                      Utforsk biler
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="px-5 sm:px-10 lg:px-16 py-16 sm:py-20 lg:py-28">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10 lg:mb-14">
            <p
              className="text-[11px] lg:text-[12px] uppercase tracking-[0.25em] font-bold mb-3"
              style={{ color: VV_ORANGE, fontFamily: inter }}
            >
              Hvorfor Bilgarasje
            </p>
            <h2
              className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight"
              style={{ color: VV_DARK, fontFamily: inter }}
            >
              Alt bilen din fortjener.
            </h2>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
            {BENEFITS.map((b) => {
              const Icon = b.icon;
              return (
                <li
                  key={b.title}
                  className="group bg-white rounded-2xl border p-6 lg:p-7 transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: "rgba(0,0,0,0.08)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ background: VV_YELLOW_SOFT }}
                  >
                    <Icon className="w-5 h-5" style={{ color: VV_DARK }} strokeWidth={2} />
                  </div>
                  <p
                    className="text-[15px] lg:text-[16px] font-bold mb-1.5 tracking-tight"
                    style={{ color: VV_DARK, fontFamily: inter }}
                  >
                    {b.title}
                  </p>
                  <p className="text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
                    {b.text}
                  </p>
                </li>
              );
            })}
          </ul>

          {/* Bottom CTA card */}
          <div
            className="mt-12 lg:mt-16 rounded-3xl border p-8 lg:p-12 text-center bg-white"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-5"
              style={{ background: VV_YELLOW_SOFT }}
            >
              <Sparkles className="w-5 h-5" style={{ color: VV_DARK }} />
            </div>
            <h3
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mb-2"
              style={{ color: VV_DARK, fontFamily: inter }}
            >
              Klar til å gi bilen din en plass?
            </h3>
            <p className="text-[13px] lg:text-[14px] text-neutral-600 mb-6">
              Gratis · Tar under 2 minutter
            </p>
            <Link
              to={primaryHref}
              className="inline-flex items-center justify-center gap-2 h-12 lg:h-14 px-8 rounded-full font-bold text-[14px] uppercase tracking-[0.14em] active:scale-[0.98] hover:brightness-105 transition"
              style={{
                background: VV_DARK,
                color: VV_YELLOW,
                fontFamily: inter,
              }}
            >
              Kom i gang nå
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-5 text-[12px] text-neutral-500">
              Har du ikke bil ennå?{" "}
              <Link
                to="/registrer"
                className="font-semibold underline-offset-2 hover:underline"
                style={{ color: VV_DARK }}
              >
                Opprett gratis konto
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
