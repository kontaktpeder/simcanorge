import { Link } from "react-router-dom";
import { useMyAttendance, useUpsertAttendance } from "@/hooks/useEventAttendees";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function EventHeroCTA({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { mutate: upsert, isPending } = useUpsertAttendance(eventId);
  const isGoing = !!attendance;

  const base =
    "inline-flex items-center justify-center font-black text-sm uppercase tracking-[0.1em] transition-all duration-200 active:scale-[0.96] select-none";

  if (!user) {
    return (
      <Link
        to="/login"
        className={`${base} px-8 py-4 bg-amber-400 text-black hover:bg-amber-300 rounded-sm`}
      >
        Bli med
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
      className={`${base} px-8 py-4 rounded-sm ${
        isGoing
          ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
          : "bg-amber-400 text-black hover:bg-amber-300"
      }`}
    >
      {isGoing ? "Påmeldt ✓" : "Meld meg på"}
    </button>
  );
}
