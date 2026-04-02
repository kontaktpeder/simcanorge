import { Badge } from "@/components/ui/badge";

type EventType = 'meet' | 'show' | 'market' | 'drive' | 'club_night' | 'exhibition' | 'open_day' | 'other';

const labels: Record<EventType, string> = {
  meet: "Biltreff",
  show: "Show",
  market: "Delemarked",
  drive: "Kjøretur",
  club_night: "Klubbkveld",
  exhibition: "Utstilling",
  open_day: "Åpen dag",
  other: "Annet",
};

const colors: Record<EventType, string> = {
  meet: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  show: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  market: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  drive: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  club_night: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  exhibition: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  open_day: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  other: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
};

export function EventTypeBadge({ type }: { type: string }) {
  const eventType = type as EventType;
  return (
    <Badge variant="secondary" className={colors[eventType] || colors.other}>
      {labels[eventType] || type}
    </Badge>
  );
}
