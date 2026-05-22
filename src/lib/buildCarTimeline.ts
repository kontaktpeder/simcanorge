import type { CarEvent } from "@/hooks/useCarEvents";
import type { CommentWithReplies } from "@/hooks/useComments";
import {
  classifyCarEvent,
  formatYearRange,
  isSpottingEvent,
  milestoneHeadline,
  placeOrCaption,
  thumbFromEvent,
  truncate,
  tsFromEvent,
  yearFromEvent,
  type TimelineItem,
} from "./timelineItemTypes";

interface BuildArgs {
  events: CarEvent[];
  comments: CommentWithReplies[];
  creatorNames?: Record<string, string>;
  heroCaptionEventId?: string | null;
  maxTimelineComments?: number;
}

export function buildCarTimeline({
  events,
  comments,
  creatorNames = {},
  heroCaptionEventId = null,
  maxTimelineComments = 2,
}: BuildArgs): TimelineItem[] {
  const publicEvents = events.filter((e) => (e.visibility ?? "public") === "public");

  const spottingSorted = publicEvents
    .filter(isSpottingEvent)
    .sort((a, b) => tsFromEvent(a) - tsFromEvent(b));
  const birth = spottingSorted[0] ?? null;
  const birthId = birth?.id ?? null;

  const items: TimelineItem[] = [];

  if (birth) {
    const authorName = birth.created_by ? creatorNames[birth.created_by] : undefined;
    items.push({
      id: `birth-${birth.id}`,
      kind: "birth",
      pinTop: true,
      sortYear: yearFromEvent(birth),
      sortTimestamp: tsFromEvent(birth),
      yearLabel: String(yearFromEvent(birth)),
      headline: "Lagt til i Bilgarasje",
      subline: authorName ? `av ${authorName}` : undefined,
      thumbnailUrl: thumbFromEvent(birth),
      authorName: authorName ?? null,
      suppressCaption: birth.id === heroCaptionEventId,
    });
  }

  for (const e of publicEvents) {
    if (e.id === birthId) continue;
    const kind = classifyCarEvent(e, birthId);
    if (kind === "observation") {
      items.push({
        id: e.id,
        kind: "observation",
        sortYear: yearFromEvent(e),
        sortTimestamp: tsFromEvent(e),
        yearLabel: String(yearFromEvent(e)),
        headline: "Observert igjen",
        subline: placeOrCaption(e),
        thumbnailUrl: thumbFromEvent(e),
      });
      continue;
    }
    if (kind === "milestone") {
      const src = (e.data as { source_label?: string } | null)?.source_label;
      items.push({
        id: e.id,
        kind: "milestone",
        sortYear: yearFromEvent(e),
        sortTimestamp: tsFromEvent(e),
        yearLabel: formatYearRange(e),
        headline: milestoneHeadline(e),
        subline: src ? `kilde: ${src}` : undefined,
      });
    }
  }

  const eligible = comments
    .filter((c) => !c.parent_id && !c.is_deleted)
    .slice(-maxTimelineComments);

  for (const c of eligible) {
    const name = c.author?.display_name ?? "Noen";
    items.push({
      id: `comment-${c.id}`,
      kind: "comment",
      sortYear: new Date(c.created_at).getFullYear(),
      sortTimestamp: new Date(c.created_at).getTime(),
      yearLabel: "",
      headline: "Kommentar",
      subline: `${name}: «${truncate(c.body ?? "", 80)}»`,
    });
  }

  const pinned = items.filter((i) => i.pinTop);
  const body = items.filter((i) => !i.pinTop);
  body.sort((a, b) => a.sortYear - b.sortYear || a.sortTimestamp - b.sortTimestamp);
  return [...pinned, ...body];
}
