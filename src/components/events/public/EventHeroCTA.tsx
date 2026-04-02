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
        className="inline-flex items-center justify-center font-bold text-[14px] rounded-full px-7 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110 transition-all duration-200 active:scale-[0.97] select-none"
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
      className={`inline-flex items-center justify-center font-bold text-[14px] rounded-full px-7 py-3 transition-all duration-200 active:scale-[0.97] select-none ${
        isGoing
          ? "bg-white/10 text-white/80 border border-white/10 hover:bg-white/15 backdrop-blur-sm"
          : "bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:brightness-110"
      }`}
    >
      {isGoing ? "Påmeldt ✓" : "Meld meg på"}
    </button>
  );
}
