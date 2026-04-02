import { MessageSquare } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";

interface Props {
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
  variant?: "dark" | "light";
}

export function CommentSection({ carId, eventId, marketplaceItemId, feedPostId, variant = "dark" }: Props) {
  const { data: comments, isLoading } = useComments({ carId, eventId, marketplaceItemId, feedPostId });
  const count = comments?.length ?? 0;
  const light = variant === "light";

  return (
    <div className="mt-8">
      <div className={`h-px ${light ? "bg-neutral-300/50" : "bg-white/[0.06]"}`} />

      <div className="py-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-4 h-4 text-[#c8102e]/70" />
          <h3
            className={`text-[14px] uppercase tracking-[0.15em] font-semibold ${light ? "text-neutral-500" : "text-white/50"}`}
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Kommentarer
          </h3>
          {count > 0 && (
            <span className={`text-[11px] ${light ? "text-neutral-400" : "text-white/20"}`}>({count})</span>
          )}
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`h-12 animate-pulse ${light ? "bg-neutral-200/50" : "bg-white/[0.02]"}`} />
            ))}
          </div>
        )}

        {!isLoading && comments && comments.length > 0 && (
          <div className={`divide-y ${light ? "divide-neutral-200/60" : "divide-white/[0.04]"}`}>
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                carId={carId}
                eventId={eventId}
                marketplaceItemId={marketplaceItemId}
                feedPostId={feedPostId}
                variant={variant}
              />
            ))}
          </div>
        )}

        {!isLoading && (!comments || comments.length === 0) && (
          <p className={`text-[13px] mb-6 ${light ? "text-neutral-400" : "text-white/20"}`}>
            Ingen kommentarer enda. Bli den første.
          </p>
        )}

        <div className={`mt-4 pt-4 border-t ${light ? "border-neutral-200/60" : "border-white/[0.04]"}`}>
          <CommentComposer
            carId={carId}
            eventId={eventId}
            marketplaceItemId={marketplaceItemId}
            feedPostId={feedPostId}
            variant={variant}
          />
        </div>
      </div>
    </div>
  );
}
