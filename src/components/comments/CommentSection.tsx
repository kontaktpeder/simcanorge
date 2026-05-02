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
    <section className="mt-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <MessageSquare className={`w-4 h-4 ${light ? "text-neutral-500" : "text-[#34eab8]"}`} />
        <h3
          className={`text-[13px] uppercase tracking-[0.2em] font-semibold ${light ? "text-neutral-700" : "text-white/85"}`}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Kommentarer
        </h3>
        {count > 0 && (
          <span
            className={`text-[11px] tracking-wider px-1.5 py-0.5 rounded ${light ? "bg-neutral-200 text-neutral-600" : "bg-white/[0.06] text-white/60"}`}
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {count}
          </span>
        )}
        <div className={`flex-1 h-px ml-2 ${light ? "bg-neutral-200" : "bg-white/[0.06]"}`} />
      </div>

      {/* Comments list */}
      {isLoading && (
        <div className="space-y-3 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className={`h-16 rounded-lg animate-pulse ${light ? "bg-neutral-200/50" : "bg-white/[0.03]"}`} />
          ))}
        </div>
      )}

      {!isLoading && comments && comments.length > 0 && (
        <div className={`mb-6 rounded-xl overflow-hidden ${light ? "bg-neutral-50 border border-neutral-200/70" : "bg-white/[0.02] border border-white/[0.06]"}`}>
          <div className={`divide-y px-4 ${light ? "divide-neutral-200/70" : "divide-white/[0.05]"}`}>
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
        </div>
      )}

      {!isLoading && (!comments || comments.length === 0) && (
        <p className={`text-[13px] mb-5 ${light ? "text-neutral-500" : "text-white/40"}`}>
          Ingen kommentarer enda. Bli den første.
        </p>
      )}

      {/* Composer */}
      <CommentComposer
        carId={carId}
        eventId={eventId}
        marketplaceItemId={marketplaceItemId}
        feedPostId={feedPostId}
        variant={variant}
      />
    </section>
  );
}
