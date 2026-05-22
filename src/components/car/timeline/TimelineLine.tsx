import { motion } from "framer-motion";
import type { TimelineItem } from "@/lib/timelineItemTypes";

interface Props {
  item: TimelineItem;
  index: number;
  isLast: boolean;
}

const oswald = { fontFamily: "'Oswald', sans-serif" } as const;

export function TimelineLine({ item, index, isLast }: Props) {
  const showThumb = (item.kind === "birth" || item.kind === "observation") && !!item.thumbnailUrl;
  const sublineClass =
    item.kind === "comment"
      ? "text-[13px] text-neutral-400 leading-snug"
      : "text-[13px] text-neutral-500 leading-snug";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="relative pl-6 py-3"
    >
      {/* vertical line */}
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[7px] top-4 bottom-0 w-px bg-neutral-300/80"
        />
      )}
      {/* dot */}
      <span
        aria-hidden
        className="absolute left-[3px] top-[18px] h-[7px] w-[7px] rounded-full bg-neutral-400"
      />

      <div className="flex items-start gap-3">
        {showThumb && (
          <img
            src={item.thumbnailUrl!}
            alt=""
            className="h-10 w-10 rounded object-cover flex-shrink-0 mt-0.5"
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            style={oswald}
            className="text-[12px] uppercase tracking-[0.14em] text-neutral-600"
          >
            {item.yearLabel && (
              <>
                <span className="text-neutral-700">{item.yearLabel}</span>
                <span className="mx-2 text-neutral-400">·</span>
              </>
            )}
            <span>{item.headline}</span>
          </div>
          {item.subline && !item.suppressCaption && (
            <div className={`${sublineClass} mt-1`}>{item.subline}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
