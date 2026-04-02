import { MessageSquare } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { CommentCard } from "./CommentCard";
import { CommentComposer } from "./CommentComposer";

interface Props {
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
}

export function CommentSection({ carId, eventId, marketplaceItemId, feedPostId }: Props) {
  const { data: comments, isLoading } = useComments({ carId, eventId, marketplaceItemId, feedPostId });
  const count = comments?.length ?? 0;

  return (
    <div className="mt-8">
      <div className="h-px bg-white/[0.06]" />

      <div className="py-6">
        {/* Heading */}
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-4 h-4 text-[#c8102e]/70" />
          <h3
            className="text-[14px] uppercase tracking-[0.15em] text-white/50 font-semibold"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Kommentarer
          </h3>
          {count > 0 && (
            <span className="text-[11px] text-white/20">({count})</span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        )}

        {/* Comments */}
        {!isLoading && comments && comments.length > 0 && (
          <div className="divide-y divide-white/[0.04]">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                carId={carId}
                eventId={eventId}
                marketplaceItemId={marketplaceItemId}
                feedPostId={feedPostId}
              />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!comments || comments.length === 0) && (
          <p className="text-[13px] text-white/20 mb-6">
            Ingen kommentarer enda. Bli den første.
          </p>
        )}

        {/* Composer */}
        <div className="mt-4 pt-4 border-t border-white/[0.04]">
          <CommentComposer
            carId={carId}
            eventId={eventId}
            marketplaceItemId={marketplaceItemId}
            feedPostId={feedPostId}
          />
        </div>
      </div>
    </div>
  );
}
