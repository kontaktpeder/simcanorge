import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Heart, Trash2, Pencil, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useEditComment } from "@/hooks/useEditComment";
import { useDeleteComment } from "@/hooks/useDeleteComment";
import { useLikeComment } from "@/hooks/useLikeComment";
import { CommentComposer } from "./CommentComposer";
import type { CommentWithReplies } from "@/hooks/useComments";

interface Props {
  comment: CommentWithReplies;
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
  isReply?: boolean;
  variant?: "dark" | "light";
}

export function CommentCard({ comment, carId, eventId, marketplaceItemId, feedPostId, isReply = false, variant = "dark" }: Props) {
  const { user } = useAuth();
  const { data: myProfile } = useMyPersonProfile();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);

  const { mutate: toggleLike } = useLikeComment();
  const { mutateAsync: editComment, isPending: isEditPending } = useEditComment();
  const { mutate: deleteComment } = useDeleteComment();

  const light = variant === "light";
  const author = comment.author as any;
  const likes = (comment as any).comment_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l: any) => l.user_id === user.id) : false;
  const isOwn = !!(myProfile && author?.id === myProfile.id);

  if (comment.is_deleted) {
    return (
      <div className={`${isReply ? `ml-10 pl-4 border-l ${light ? "border-neutral-200/60" : "border-white/[0.04]"}` : ""}`}>
        <p className={`text-[12px] italic py-2 ${light ? "text-neutral-400" : "text-white/15"}`}>Kommentar slettet</p>
        {!isReply && (comment as any).replies?.length > 0 && (
          <div className="space-y-0">
            {(comment as any).replies.map((reply: any) => (
              <CommentCard key={reply.id} comment={reply} carId={carId} eventId={eventId}
                marketplaceItemId={marketplaceItemId} feedPostId={feedPostId} isReply variant={variant} />
            ))}
          </div>
        )}
      </div>
    );
  }

  async function handleSaveEdit() {
    if (!editBody.trim()) return;
    try {
      await editComment({ id: comment.id, body: editBody });
      setIsEditing(false);
      toast.success("Kommentar oppdatert");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  function handleDelete() {
    if (!window.confirm("Slette denne kommentaren?")) return;
    deleteComment(comment.id, {
      onSuccess: () => toast.success("Kommentar slettet"),
      onError: () => toast.error("Noe gikk galt"),
    });
  }

  return (
    <div className={`${isReply ? `ml-10 pl-4 border-l ${light ? "border-neutral-200/60" : "border-white/[0.04]"}` : ""}`}>
      <div className="py-4">
        <div className="flex gap-3">
          {author?.avatar_url ? (
            <Link to={`/profil/${author.slug}`}>
              <img src={author.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover ring-1 flex-shrink-0 ${light ? "ring-neutral-200" : "ring-white/[0.08]"}`} />
            </Link>
          ) : (
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${light ? "bg-neutral-200" : "bg-white/[0.06]"}`}>
              <span className={`text-[11px] ${light ? "text-neutral-500" : "text-white/40"}`} style={{ fontFamily: "'Oswald', sans-serif" }}>
                {author?.display_name?.[0] ?? "?"}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link to={`/profil/${author?.slug}`}
                className={`text-[12px] uppercase tracking-[0.1em] font-medium transition-colors ${light ? "text-neutral-600 hover:text-neutral-900" : "text-white/60 hover:text-white"}`}
                style={{ fontFamily: "'Oswald', sans-serif" }}>
                {author?.display_name}
              </Link>
              <span className={`text-[10px] ${light ? "text-neutral-400" : "text-white/20"}`}>
                {formatDistanceToNow(new Date(comment.created_at), { locale: nb, addSuffix: true })}
              </span>
              {comment.updated_at && (
                <span className={`text-[10px] italic ${light ? "text-neutral-300" : "text-white/15"}`}>redigert</span>
              )}
            </div>

            {isEditing ? (
              <div>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSaveEdit();
                    if (e.key === "Escape") { setIsEditing(false); setEditBody(comment.body); }
                  }}
                  className={`w-full bg-transparent border-b px-0 py-2 resize-none focus:outline-none transition-colors leading-relaxed text-[15px] ${
                    light ? "border-neutral-300 focus:border-neutral-500 text-neutral-800" : "border-white/[0.12] focus:border-[#34eab8]/60 text-white/90"
                  }`}
                />
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={handleSaveEdit} disabled={isEditPending}
                    className={`text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors ${light ? "text-neutral-500 hover:text-neutral-800" : "text-white/50 hover:text-white"}`}
                    style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {isEditPending ? "Lagrer…" : "Lagre"}
                  </button>
                  <button onClick={() => { setIsEditing(false); setEditBody(comment.body); }}
                    className={`text-[11px] transition-colors ${light ? "text-neutral-400 hover:text-neutral-600" : "text-white/20 hover:text-white/40"}`}>
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-[15px] leading-[1.7] whitespace-pre-wrap ${light ? "text-neutral-700" : "text-white/85"}`}>{comment.body}</p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => user && toggleLike({ commentId: comment.id, liked })}
                  className={`flex items-center gap-1 transition-colors ${
                    liked ? "text-[#c8102e]" : light ? "text-neutral-300 hover:text-neutral-500" : "text-white/15 hover:text-white/40"
                  } ${!user ? "cursor-default" : "cursor-pointer"}`}
                >
                  <Heart className={`w-3 h-3 ${liked ? "fill-current" : ""}`} />
                  {likeCount > 0 && <span className="text-[10px]">{likeCount}</span>}
                </button>

                {!isReply && user && (
                  <button onClick={() => setShowReplyForm(!showReplyForm)}
                    className={`flex items-center gap-1 transition-colors ${light ? "text-neutral-300 hover:text-neutral-500" : "text-white/15 hover:text-white/40"}`}>
                    <CornerDownRight className="w-3 h-3" />
                    <span className="text-[10px] uppercase tracking-[0.1em]" style={{ fontFamily: "'Oswald', sans-serif" }}>Svar</span>
                  </button>
                )}

                {isOwn && (
                  <>
                    <button onClick={() => setIsEditing(true)}
                      className={`flex items-center gap-1 transition-colors ${light ? "text-neutral-300 hover:text-neutral-500" : "text-white/10 hover:text-white/35"}`}>
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={handleDelete}
                      className={`flex items-center gap-1 transition-colors ${light ? "text-neutral-300 hover:text-red-500" : "text-white/10 hover:text-[#c8102e]/60"}`}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isReply && (comment as any).replies?.length > 0 && (
        <div>
          {(comment as any).replies.map((reply: any) => (
            <CommentCard key={reply.id} comment={reply} carId={carId} eventId={eventId}
              marketplaceItemId={marketplaceItemId} feedPostId={feedPostId} isReply variant={variant} />
          ))}
        </div>
      )}

      {showReplyForm && (
        <div className={`ml-10 pl-4 border-l ${light ? "border-neutral-200/60" : "border-white/[0.04]"}`}>
          <CommentComposer
            carId={carId} eventId={eventId}
            marketplaceItemId={marketplaceItemId} feedPostId={feedPostId}
            parentId={comment.id}
            placeholder={`Svar til ${author?.display_name}…`}
            autoFocus
            onSuccess={() => setShowReplyForm(false)}
            onCancel={() => setShowReplyForm(false)}
            variant={variant}
          />
        </div>
      )}
    </div>
  );
}
