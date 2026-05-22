import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCarEvents } from "@/hooks/useCarEvents";
import { useComments } from "@/hooks/useComments";
import { buildCarTimeline } from "@/lib/buildCarTimeline";
import { TimelineLine } from "./TimelineLine";

interface Props {
  carId: string;
  heroCaptionEventId?: string | null;
}

function useCreatorNames(userIds: string[]) {
  const sorted = [...new Set(userIds.filter(Boolean))].sort();
  const key = sorted.join(",");
  return useQuery({
    queryKey: ["timeline-creators", key],
    queryFn: async () => {
      if (sorted.length === 0) return {} as Record<string, string>;
      const { data, error } = await supabase
        .from("person_profiles")
        .select("user_id, display_name")
        .in("user_id", sorted);
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        if (row.user_id && row.display_name) map[row.user_id] = row.display_name;
      }
      return map;
    },
    enabled: sorted.length > 0,
    staleTime: 60_000,
  });
}

export function CarTimeline({ carId, heroCaptionEventId = null }: Props) {
  const { data: events = [], isLoading: eventsLoading } = useCarEvents(carId, {
    includePrivate: false,
  });
  const { data: comments = [], isLoading: commentsLoading } = useComments({ carId });

  const userIds = useMemo(
    () => events.map((e) => e.created_by).filter((x): x is string => !!x),
    [events],
  );
  const { data: creatorNames = {} } = useCreatorNames(userIds);

  const items = useMemo(
    () =>
      buildCarTimeline({
        events,
        comments,
        creatorNames,
        heroCaptionEventId,
      }),
    [events, comments, creatorNames, heroCaptionEventId],
  );

  if (eventsLoading || commentsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-[13px] text-neutral-500 italic">
        Historien bygges når folk bidrar.
      </div>
    );
  }

  return (
    <div className="relative">
      {items.map((item, i) => (
        <TimelineLine key={item.id} item={item} index={i} isLast={i === items.length - 1} />
      ))}
    </div>
  );
}
