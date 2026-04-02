import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  useMyAttendance,
  useUpsertAttendance,
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
      <Button
        asChild
        size="lg"
        className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 border-0"
      >
        <Link to="/login">Logg inn for å melde deg på</Link>
      </Button>
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
          ? "bg-white/10 text-white border border-white/20 hover:bg-white/15 backdrop-blur-sm"
          : "bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20 border-0"
      }
    >
      {isGoing ? "✓ Påmeldt" : "Meld deg på"}
    </Button>
  );
}
