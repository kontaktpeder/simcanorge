import { Button } from "@/components/ui/button";
import {
  useMyAttendance,
  useToggleAttendance,
  useEventAttendeeCount,
} from "@/hooks/useEventAttendees";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Users } from "lucide-react";

export function EventAttendButton({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const { data: attendance } = useMyAttendance(eventId);
  const { data: count } = useEventAttendeeCount(eventId);
  const { mutate: toggle, isPending } = useToggleAttendance(eventId);

  const isGoing = !!attendance;

  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Users className="w-4 h-4" />
        {count ?? 0} påmeldt
      </span>
      {user ? (
        <Button
          size="sm"
          variant={isGoing ? "secondary" : "default"}
          disabled={isPending}
          onClick={() =>
            toggle(attendance?.id ?? null, {
              onSuccess: () =>
                toast.success(isGoing ? "Påmelding fjernet" : "Du er påmeldt!"),
              onError: () => toast.error("Noe gikk galt"),
            })
          }
        >
          {isGoing ? "✅ Påmeldt" : "Meld deg på"}
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Logg inn for å melde deg på
        </p>
      )}
    </div>
  );
}
