import { Link } from "react-router-dom";
import { Plus, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface CreateCTAProps {
  createUrl: string;
  label: string;
  description?: string;
  variant?: "strip" | "card" | "inline" | "ghost";
  className?: string;
}

export function CreateCTA({
  createUrl,
  label,
  description,
  variant = "strip",
  className = "",
}: CreateCTAProps) {
  const { user } = useAuth();
  const href = user
    ? createUrl
    : `/login?returnUrl=${encodeURIComponent(createUrl)}`;
  const Icon = user ? Plus : LogIn;
  const text = user ? label : "Logg inn for å opprette";

  if (variant === "ghost") {
    return (
      <Link
        to={href}
        className={`inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.15em] text-[#c4962c] hover:text-[#e8c547] font-bold transition-colors ${className}`}
      >
        <Icon className="w-3.5 h-3.5" />
        {text}
      </Link>
    );
  }

  if (variant === "inline") {
    return (
      <Link
        to={href}
        className={`inline-flex items-center gap-2 px-4 py-2 text-[12px] uppercase tracking-[0.12em] font-bold text-[#0f0d0b] transition-all hover:brightness-110 ${className}`}
        style={{ background: "linear-gradient(135deg, #d4a017, #e8c547, #c4962c)" }}
      >
        <Icon className="w-3.5 h-3.5" />
        {text}
      </Link>
    );
  }

  if (variant === "card") {
    return (
      <Link
        to={href}
        className={`group flex items-center gap-4 p-4 border border-white/[0.08] hover:border-[#c4962c]/30 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 ${className}`}
      >
        <div className="w-10 h-10 rounded-full bg-[#c4962c]/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-[#c4962c]" />
        </div>
        <div className="flex-1 min-w-0">
          {description && (
            <p className="text-[12px] text-white/30 mb-0.5">{description}</p>
          )}
          <p className="text-[14px] text-white/70 group-hover:text-white font-medium transition-colors">
            {text}
          </p>
        </div>
        <span className="text-white/20 group-hover:text-[#c4962c] transition-colors">→</span>
      </Link>
    );
  }

  // strip (default)
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 px-5 md:px-8 py-3 border-b border-white/[0.06] bg-white/[0.02] ${className}`}>
      {description && (
        <p className="text-[13px] text-white/40">{description}</p>
      )}
      <Link
        to={href}
        className="inline-flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.15em] font-bold text-[#0f0d0b] transition-all hover:brightness-110 ml-auto"
        style={{ background: "linear-gradient(135deg, #d4a017, #e8c547, #c4962c)" }}
      >
        <Icon className="w-3.5 h-3.5" />
        {text}
      </Link>
    </div>
  );
}
