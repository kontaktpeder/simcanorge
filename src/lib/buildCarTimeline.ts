import type { CarEvent } from "@/hooks/useCarEvents";
import type { EventCategory } from "@/data/carEventCategories";
import {
  classifyCarEvent,
  formatYearRange,
  isSpottingEvent,
  milestoneHeadline,
  placeOrCaption,
  thumbFromEvent,
  tsFromEvent,
  yearFromEvent,
  type TimelineItem,
} from "./timelineItemTypes";

interface BuildArgs {
  events: CarEvent[];
  creatorNames?: Record<string, string>;
  heroCaptionEventId?: string | null;
  carCreatedAt?: string | null;
}

export function buildCarTimeline({
  events,
  creatorNames = {},
  heroCaptionEventId = null,
  carCreatedAt = null,
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
      category: "birth",
    });
  } else if (carCreatedAt) {
    const d = new Date(carCreatedAt);
    items.push({
      id: `birth-car-${carCreatedAt}`,
      kind: "birth",
      pinTop: true,
      sortYear: d.getFullYear(),
      sortTimestamp: d.getTime(),
      yearLabel: String(d.getFullYear()),
      headline: "Lagt til i Bilgarasje",
      category: "birth",
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
        category: e.category as EventCategory,
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
        category: e.category as EventCategory,
      });
    }
  }

  const pinned = items.filter((i) => i.pinTop);
  const body = items.filter((i) => !i.pinTop);
  body.sort((a, b) => a.sortYear - b.sortYear || a.sortTimestamp - b.sortTimestamp);
  return [...pinned, ...body];
}
