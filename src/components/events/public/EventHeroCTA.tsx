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

  const baseClasses =
    "inline-flex items-center justify-center font-bold text-base px-8 py-3.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]";

  if (!user) {
    return (
      <Link
        to="/login"
        className={`${baseClasses} bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600`}
      >
        Logg inn for å bli med 🚗
      </Link>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        upsert(attendance?.id ?? null, {
          onSuccess: () =>
            toast.success(isGoing ? "Påmelding fjernet" : "Du er påmeldt! 🎉"),
          onError: () => toast.error("Noe gikk galt"),
        })
      }
      className={`${baseClasses} ${
        isGoing
          ? "bg-white text-stone-700 border-2 border-stone-200 hover:bg-stone-50"
          : "bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600"
      }`}
    >
      {isGoing ? "✓ Påmeldt" : "Meld deg på 🙌"}
    </button>
  );
}
