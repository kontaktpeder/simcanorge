import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import { CommentCard } from "@/components/comments/CommentCard";
import { CommentComposer } from "@/components/comments/CommentComposer";

interface Props {
  carId: string;
}

export function SpottingCommentsBlock({ carId }: Props) {
  const { data: comments, isLoading } = useComments({ carId });
  const [open, setOpen] = useState(false);
  const count = comments?.length ?? 0;
  const empty = !isLoading && count === 0;

  return (
    <section className="mt-2">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="w-4 h-4 text-neutral-500" />
        <h3
          className="text-[12px] uppercase tracking-[0.2em] font-semibold text-neutral-700"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Kommentarer
        </h3>
        {count > 0 && (
          <span
            className="text-[11px] tracking-wider px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {count}
          </span>
        )}
        <div className="flex-1 h-px ml-2 bg-neutral-200" />
      </div>

      {isLoading && (
        <div className="space-y-3 mb-4">
          <div className="h-12 rounded-lg animate-pulse bg-neutral-200/50" />
        </div>
      )}

      {!isLoading && count > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden bg-neutral-50 border border-neutral-200/70">
          <div className="divide-y divide-neutral-200/70 px-4">
            {comments!.map((comment) => (
              <CommentCard key={comment.id} comment={comment} carId={carId} variant="light" />
            ))}
          </div>
        </div>
      )}

      {empty && !open && (
        <p className="text-[13px] mb-3 text-neutral-500">Ingen kommentarer enda.</p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-neutral-600 hover:text-neutral-900 transition-colors border-b border-neutral-300 hover:border-neutral-700 pb-0.5"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Skriv en kommentar
        </button>
      ) : (
        <CommentComposer
          carId={carId}
          variant="light"
          autoFocus
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      )}
    </section>
  );
}
