import { Link } from "react-router-dom";
import { Car, PlusCircle } from "lucide-react";

type Props = { className?: string; light?: boolean };

export function PlatformContextBanner({ className = "", light = false }: Props) {
  const base = light
    ? "bg-[#3a2e24]/5 border-y border-[#3a2e24]/10 text-[#3a2e24]"
    : "bg-white/[0.03] border-y border-white/10 text-white/80";
  const linkCls = light
    ? "text-[#3a2e24] hover:text-[#c4962c]"
    : "text-white/80 hover:text-[#34eab8]";

  return (
    <div className={`${base} ${className}`}>
      <div className="container mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] tracking-wide">
          Denne siden er en del av <strong>Bilgarasje.no</strong>
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/biler"
            className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] ${linkCls}`}
          >
            <Car className="w-3.5 h-3.5" />
            Utforsk flere biler
          </Link>
          <Link
            to="/legg-til-bil"
            className={`inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] ${linkCls}`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Lag din garasje
          </Link>
        </div>
      </div>
    </div>
  );
}
