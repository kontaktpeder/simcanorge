import { Link } from "react-router-dom";
import { useMyAttendance, useUpsertAttendance } from "@/hooks/useEventAttendees";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function EventHeroCTA({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { mutate: upsert, isPending } = useUpsertAttendance(eventId);
  const isGoing = !!attendance;

  if (!user) {
    return (
      <Link
        to="/login"
        className="px-6 py-3 rounded-lg bg-amber-400 text-black font-medium hover:bg-amber-300 transition inline-flex items-center justify-center"
      >
        Meld deg på
      </Link>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        upsert(attendance?.id ?? null, {
          onSuccess: () => toast.success(isGoing ? "Påmelding fjernet" : "Du er påmeldt!"),
          onError: () => toast.error("Noe gikk galt"),
        })
      }
      className={`px-6 py-3 rounded-lg font-medium transition inline-flex items-center justify-center ${
        isGoing
          ? "bg-white/10 text-white hover:bg-white/20"
          : "bg-amber-400 text-black hover:bg-amber-300"
      }`}
    >
      {isGoing ? "Påmeldt ✓" : "Meld meg på"}
    </button>
  );
}
