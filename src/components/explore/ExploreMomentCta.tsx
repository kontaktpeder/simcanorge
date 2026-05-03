import { Camera } from "lucide-react";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type Variant = "top" | "mid";

interface Props {
  variant?: Variant;
  title?: string;
  subtitle?: string;
  onClick: () => void;
}

export function ExploreMomentCta({ variant = "top", title, subtitle, onClick }: Props) {
  const isMid = variant === "mid";

  return (
    <div
      className={`relative rounded-xl border overflow-hidden ${
        isMid ? "px-4 py-5" : "px-5 py-6 sm:px-6 sm:py-7"
      }`}
      style={{
        background:
          "linear-gradient(135deg, rgba(45,212,168,0.08) 0%, rgba(20,26,34,0.6) 60%)",
        borderColor: "rgba(45,212,168,0.18)",
      }}
    >
      <p
        className={`uppercase font-bold text-white leading-tight ${
          isMid ? "text-[14px]" : "text-[16px] sm:text-[18px]"
        }`}
        style={oswald}
      >
        {title ?? (isMid ? "Har du sett noe i dag?" : "Hva har du sett i dag?")}
      </p>
      {subtitle && (
        <p className="text-[12px] text-white/50 mt-1" style={chakra}>
          {subtitle}
        </p>
      )}
      <button
        onClick={onClick}
        className={`mt-3 w-full flex items-center justify-center gap-2 rounded-lg font-bold uppercase tracking-[0.12em] text-[#070b10] transition hover:brightness-110 ${
          isMid ? "py-2.5 text-[11px]" : "py-3 text-[12px]"
        }`}
        style={{
          ...chakra,
          background: "linear-gradient(135deg, #34eab8, #2dd4a8)",
          boxShadow: "0 0 20px rgba(45,212,168,0.25)",
        }}
      >
        <Camera className="w-4 h-4" />
        Del øyeblikk
      </button>
    </div>
  );
}
