import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useComments } from "@/hooks/useComments";
import { CommentCard } from "@/components/comments/CommentCard";
import { CommentComposer } from "@/components/comments/CommentComposer";

interface Props {
  carId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SpottingCommentsSheet({ carId, open, onOpenChange }: Props) {
  const { data: comments, isLoading } = useComments({ carId });
  const count = comments?.length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[80vh] p-0 flex flex-col rounded-t-2xl bg-white text-neutral-900 border-neutral-200"
      >
        <SheetHeader className="px-4 pt-3 pb-2 border-b border-neutral-200">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-300" />
          <SheetTitle
            className="text-center text-[13px] uppercase tracking-[0.18em] font-semibold text-neutral-700"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Kommentarer{count > 0 ? ` (${count})` : ""}
          </SheetTitle>
        </SheetHeader>

        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {isLoading && (
            <div className="space-y-2">
              <div className="h-12 rounded-lg animate-pulse bg-neutral-200/60" />
              <div className="h-12 rounded-lg animate-pulse bg-neutral-200/60" />
            </div>
          )}

          {!isLoading && count === 0 && (
            <p className="text-[14px] text-neutral-500 text-center py-10">
              Ingen kommentarer enda. Vær først ute.
            </p>
          )}

          {!isLoading && count > 0 && (
            <div className="divide-y divide-neutral-200/70">
              {comments!.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  carId={carId}
                  variant="light"
                />
              ))}
            </div>
          )}
        </div>

        <div
          className="border-t border-neutral-200 bg-white px-4 pt-3 pb-3"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
        >
          <CommentComposer carId={carId} variant="light" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
