import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

export function useEventAttendeeCount(eventId: string | undefined) {
  return useQuery({
    queryKey: ["event_attendee_count", eventId],
    queryFn: async () => {
      if (!eventId) return 0;
      const { data, error } = await supabase
        .rpc("get_event_attendee_count", { p_event_id: eventId });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    enabled: !!eventId,
  });
}

export function useMyAttendance(eventId: string | undefined) {
  const { data: profile } = useMyPersonProfile();
  return useQuery({
    queryKey: ["my_event_attendance", eventId, profile?.id],
    queryFn: async () => {
      if (!eventId || !profile) return null;
      const { data, error } = await supabase
        .from("event_attendees" as any)
        .select("id, status")
        .eq("event_id", eventId)
        .eq("profile_id", profile.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId && !!profile,
  });
}

export function useToggleAttendance(eventId: string) {
  const { data: profile } = useMyPersonProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentAttendanceId: string | null) => {
      if (!profile) throw new Error("Ingen profil");
      if (currentAttendanceId) {
        const { error } = await supabase
          .from("event_attendees" as any)
          .delete()
          .eq("id", currentAttendanceId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_attendees" as any)
          .insert({ event_id: eventId, profile_id: profile.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event_attendee_count", eventId] });
      queryClient.invalidateQueries({ queryKey: ["my_event_attendance", eventId] });
    },
  });
}
