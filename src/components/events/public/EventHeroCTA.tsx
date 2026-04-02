import { Button } from "@/components/ui/button";
import {
  useMyAttendance,
  useUpsertAttendance,
  useEventAttendeeCount,
} from "@/hooks/useEventAttendees";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function EventHeroCTA({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { mutate: upsert, isPending } = useUpsertAttendance(eventId);
  const isGoing = !!attendance;

  if (!user) {
    return (
      <p className="text-sm text-[#8B98A5]">
        Logg inn for å melde deg på
      </p>
    );
  }

  return (
    <Button
      size="lg"
      disabled={isPending}
      onClick={() =>
        upsert(attendance?.id ?? null, {
          onSuccess: () =>
            toast.success(isGoing ? "Påmelding fjernet" : "Du er påmeldt!"),
          onError: () => toast.error("Noe gikk galt"),
        })
      }
      className={
        isGoing
          ? "bg-[#11161D] text-[#E6EDF3] border border-[#1F2730] hover:bg-[#1a2130]"
          : "bg-amber-500 text-black hover:bg-amber-400 font-medium"
      }
    >
      {isGoing ? "✓ Påmeldt" : "Meld deg på"}
    </Button>
  );
}
