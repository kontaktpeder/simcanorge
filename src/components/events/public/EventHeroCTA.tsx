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
    "inline-flex items-center justify-center font-bold text-[15px] rounded-full transition-all duration-200 active:scale-[0.97] select-none";

  if (!user) {
    return (
      <Link
        to="/login"
        className={`${base} px-8 py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-110`}
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
      className={`${base} px-8 py-3.5 ${
        isGoing
          ? "bg-white/10 text-white border border-white/10 hover:bg-white/15"
          : "bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 hover:brightness-110"
      }`}
    >
      {isGoing ? "Påmeldt" : "Meld meg på"}
    </button>
  );
}
