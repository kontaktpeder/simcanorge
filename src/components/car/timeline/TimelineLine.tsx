import { motion } from "framer-motion";
import {
  Factory,
  ClipboardList,
  Handshake,
  Car,
  Warehouse,
  Wrench,
  AlertTriangle,
  Sparkles,
  PlusCircle,
  Eye,
  type LucideIcon,
} from "lucide-react";
import type { TimelineItem } from "@/lib/timelineItemTypes";
import type { EventCategory } from "@/data/carEventCategories";

interface Props {
  item: TimelineItem;
  index: number;
  isLast: boolean;
  tone?: "dark" | "light";
}

const CATEGORY_ICON: Record<EventCategory | "birth", LucideIcon> = {
  birth: PlusCircle,
  opprinnelse: Factory,
  registrering: ClipboardList,
  eierskap: Handshake,
  bruk: Car,
  stillstand: Warehouse,
  restaurering: Wrench,
  skade: AlertTriangle,
  gjenoppdagelse: Eye,
};

export function TimelineLine({ item, index, isLast, tone = "dark" }: Props) {
  const showThumb = (item.kind === "birth" || item.kind === "observation") && !!item.thumbnailUrl;
  const Icon = (item.category && CATEGORY_ICON[item.category]) || Sparkles;
  const accent = item.kind === "birth";
  const light = tone === "light";

  return (
    <motion.li
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="relative pl-10 pr-1 py-4"
    >
      {/* vertical rail */}
      {!isLast && (
        <span
          aria-hidden
          className={`absolute left-[15px] top-9 bottom-0 w-px ${light ? "bg-black/10" : "bg-white/[0.08]"}`}
        />
      )}

      {/* icon node */}
      <span
        aria-hidden
        className={`absolute left-0 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full border ${
          light
            ? accent
              ? "border-[#C10D0D]/30 bg-[#C10D0D]/10 text-[#C10D0D]"
              : "border-black/10 bg-[#f6f3ee] text-[#071628]/70"
            : accent
              ? "border-white/20 bg-white/[0.06] text-white/90"
              : "border-white/10 bg-white/[0.02] text-white/55"
        }`}
      >
        <Icon className="h-[15px] w-[15px]" strokeWidth={1.6} />
      </span>

      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div
            className={`flex items-baseline gap-2 font-sans text-sm ${light ? "text-[#071628]/60" : "text-white/40"}`}
          >
            {item.yearLabel && (
              <span className={light ? "text-[#071628]" : "text-white/70"}>{item.yearLabel}</span>
            )}
          </div>
          <div
            className={`mt-1 font-sans text-base leading-snug ${light ? "text-[#1c1917]" : "text-white/90"}`}
          >
            {item.headline}
          </div>
          {item.subline && !item.suppressCaption && (
            <div className={`mt-1 font-sans text-sm leading-snug ${light ? "text-[#1c1917]/70" : "text-white/45"}`}>
              {item.subline}
            </div>
          )}
        </div>

        {showThumb && (
          <img
            src={item.thumbnailUrl!}
            alt=""
            className="h-12 w-12 rounded-md object-cover flex-shrink-0 ring-1 ring-white/10"
            loading="lazy"
          />
        )}
      </div>
    </motion.li>
  );
}
