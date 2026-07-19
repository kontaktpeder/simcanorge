import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

/** Shared light garage chrome — used by Min garasje, Konto and Profil. */
export const GARAGE_BG = "#f3f3f3";
export const garageFont = {
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
} as const;

interface GaragePageShellProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function GaragePageShell({
  title,
  backTo = "/min-garasje",
  backLabel = "Tilbake til garasjen",
  actions,
  children,
}: GaragePageShellProps) {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen pb-32 text-neutral-900"
      style={{ backgroundColor: GARAGE_BG, ...garageFont }}
    >
      <div className="bg-white border-b border-black/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="w-9 h-9 -ml-2 inline-flex items-center justify-center rounded-full hover:bg-black/5 text-neutral-700"
            aria-label={backLabel}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
          <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
          {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">{children}</div>
    </div>
  );
}

export function GaragePanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-white border border-black/[0.08] p-4 sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function GarageChipLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold text-neutral-700 bg-black/[0.04] hover:bg-black/[0.07] transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
