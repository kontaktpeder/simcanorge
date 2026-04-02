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
      <Link
        to="/login"
        className="inline-flex items-center justify-center font-semibold text-[15px] px-6 py-3 rounded-xl bg-white text-black hover:bg-white/90 transition-all active:scale-[0.97]"
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
          onSuccess: () =>
            toast.success(isGoing ? "Påmelding fjernet" : "Du er påmeldt!"),
          onError: () => toast.error("Noe gikk galt"),
        })
      }
      className={`inline-flex items-center justify-center font-semibold text-[15px] px-6 py-3 rounded-xl transition-all active:scale-[0.97] ${
        isGoing
          ? "bg-white/10 text-white border border-white/10 hover:bg-white/15"
          : "bg-white text-black hover:bg-white/90"
      }`}
    >
      {isGoing ? "✓ Påmeldt" : "Meld meg på"}
    </button>
  );
}
