import type { CarEvent } from "@/hooks/useCarEvents";
import {
  getEventLabel,
  getCategoryLabel,
  type EventCategory,
  type EventType,
} from "@/data/carEventCategories";

export type TimelineItemKind = "birth" | "milestone" | "observation" | "comment";

export type TimelineItem = {
  id: string;
  kind: TimelineItemKind;
  sortYear: number;
  sortTimestamp: number;
  pinTop?: boolean;
  yearLabel: string;
  headline: string;
  subline?: string;
  thumbnailUrl?: string | null;
  authorName?: string | null;
  suppressCaption?: boolean;
};

const MILESTONE_CATEGORIES = new Set<EventCategory>([
  "opprinnelse",
  "registrering",
  "eierskap",
  "bruk",
  "stillstand",
  "restaurering",
  "skade",
]);

export function isSpottingEvent(e: CarEvent): boolean {
  if (e.category === "gjenoppdagelse") return true;
  const src = (e.data as { source?: string } | null)?.source;
  return src === "spotting";
}

export function classifyCarEvent(
  e: CarEvent,
  birthEventId: string | null,
): TimelineItemKind {
  if (birthEventId && e.id === birthEventId) return "birth";
  if (isSpottingEvent(e)) return "observation";
  if (MILESTONE_CATEGORIES.has(e.category as EventCategory)) return "milestone";
  return "milestone";
}

export function milestoneHeadline(e: CarEvent): string {
  if (e.title) return e.title;
  const label = getEventLabel(e.category as EventCategory, e.event_type as EventType);
  if (label && label !== e.event_type) return label;
  return getCategoryLabel(e.category as EventCategory);
}

export function yearFromEvent(e: CarEvent): number {
  return (
    e.year ??
    e.year_from ??
    (e.occurred_at ? new Date(e.occurred_at).getFullYear() : 0) ??
    new Date(e.created_at).getFullYear()
  );
}

export function tsFromEvent(e: CarEvent): number {
  if (e.occurred_at) return new Date(e.occurred_at).getTime();
  return new Date(e.created_at).getTime();
}

export function formatYearRange(e: CarEvent): string {
  if (e.year) return String(e.year);
  if (e.year_from && e.year_to) return `${e.year_from}–${e.year_to}`;
  if (e.year_from) return `${e.year_from}–nå`;
  if (e.occurred_at) return String(new Date(e.occurred_at).getFullYear());
  return String(new Date(e.created_at).getFullYear());
}

export function thumbFromEvent(e: CarEvent): string | null {
  const imgs = e.car_event_images ?? [];
  const sorted = [...imgs].sort((a, b) => a.sort_order - b.sort_order);
  return sorted[0]?.image_url ?? null;
}

export function placeOrCaption(e: CarEvent, max = 60): string | undefined {
  const desc = e.description?.trim();
  if (!desc) return undefined;
  const first = desc.split(/\n+/)[0].trim();
  return first.length > max ? first.slice(0, max - 1).trimEnd() + "…" : first;
}

export function truncate(s: string, max = 80): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max - 1).trimEnd() + "…" : t;
}
