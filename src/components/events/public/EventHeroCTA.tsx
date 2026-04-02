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
    "inline-flex items-center justify-center font-semibold text-[15px] rounded-xl transition-all duration-150 active:scale-[0.97] select-none px-7 py-3.5 min-w-[160px]";

  if (!user) {
    return (
      <Link to="/login" className={`${base} bg-neutral-900 text-white hover:bg-neutral-800`} aria-label="Jeg kommer">
        Jeg kommer
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
      className={`${base} ${
        isGoing
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
          : "bg-neutral-900 text-white hover:bg-neutral-800"
      }`}
    >
      {isGoing ? "Jeg kommer ✓" : "Jeg kommer"}
    </button>
  );
}
