import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Heart, Car, ShoppingBag, CalendarDays, Pencil, MoreHorizontal, Trash2, Check, X, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useLikeFeedPost } from "@/hooks/useLikeFeedPost";
import { useEditFeedPost } from "@/hooks/useEditFeedPost";
import { useDeleteFeedPost } from "@/hooks/useDeleteFeedPost";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { CommentSection } from "@/components/comments/CommentSection";
import type { FeedPost } from "@/hooks/useFeedPosts";

const TYPE_META: Record<string, { label: string; icon: typeof Pencil }> = {
  manual:                { label: "Oppdatering",  icon: Pencil },
  car_published:         { label: "Ny bil",        icon: Car },
  car_update:            { label: "Bil oppdatert", icon: Car },
  marketplace_published: { label: "Til salgs",     icon: ShoppingBag },
  event_published:       { label: "Arrangement",   icon: CalendarDays },
};

function getAllImages(post: FeedPost) {
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;

  const imgs =
    car?.car_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    marketItem?.marketplace_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    event?.event_images?.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    [];

  if (imgs.length === 0 && post.snapshot_image_url) {
    return [{ url: post.snapshot_image_url }];
  }
  return imgs as { url: string; alt?: string }[];
}

export function FeedCard({ post }: { post: FeedPost }) {
  const { user } = useAuth();
  const { data: myProfile } = useMyPersonProfile();
  const { mutate: toggleLike } = useLikeFeedPost();
  const { mutateAsync: editPost, isPending: isEditPending } = useEditFeedPost();
  const { mutate: deletePost } = useDeleteFeedPost();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [showComments, setShowComments] = useState(false);

  const likes = (post as any).feed_post_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l: any) => l.user_id === user.id) : false;

  const author = (post as any).author;
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;

  const isOwn = !!(myProfile && author?.id === myProfile.id);

  const entityTitle =
    car?.title ?? marketItem?.title ?? event?.title ?? post.snapshot_title ?? null;

  const allImages = getAllImages(post);
  const heroImage = allImages[0]?.url ?? null;

  const entityLink =
    car ? `/biler/${car.slug}` :
    marketItem ? `/markedsplass/${marketItem.slug}` :
    event ? `/e/${event.slug}` :
    null;

  const meta = TYPE_META[post.post_type] ?? TYPE_META.manual;
  const Icon = meta.icon;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { locale: nb, addSuffix: true });

  async function handleSaveEdit() {
    try {
      await editPost({ id: post.id, body: editBody });
      setIsEditing(false);
      toast.success("Innlegg oppdatert");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  function handleDelete() {
    if (!window.confirm("Slette dette innlegget?")) return;
    deletePost(post.id, {
      onSuccess: () => toast.success("Innlegg slettet"),
      onError: () => toast.error("Noe gikk galt"),
    });
  }

  return (
    <>
      <article className="group">
        {/* Type label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-[#c8102e]" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#c8102e]"
              style={{ fontFamily: "'Oswald', sans-serif" }}>
              {meta.label}
            </span>
            <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase">{timeAgo}</span>
            {(post as any).updated_at && (
              <span className="text-[10px] text-white/15 italic">redigert</span>
            )}
          </div>

          {/* Owner menu */}
          {isOwn && !isEditing && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-white/15 hover:text-white/50 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1d21] border border-white/[0.08] py-1 z-20 min-w-[120px]">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>
                    <Pencil className="w-3 h-3" /> Rediger
                  </button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-[#c8102e]/60 hover:text-[#c8102e] hover:bg-white/[0.04] transition-colors"
                    style={{ fontFamily: "'Oswald', sans-serif" }}>
                    <Trash2 className="w-3 h-3" /> Slett
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Image */}
        {heroImage && (
          <div className="relative cursor-pointer overflow-hidden mb-5"
            onClick={() => setLightboxOpen(true)}>
            <img src={heroImage} alt={entityTitle ?? ""}
              className="w-full h-[320px] sm:h-[400px] md:h-[460px] object-cover transition-transform duration-700 group-hover:scale-[1.015]" />
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4 text-[11px] text-white/70 tracking-[0.1em] font-medium uppercase"
                style={{ fontFamily: "'Oswald', sans-serif" }}>
                1 / {allImages.length}
              </div>
            )}
          </div>
        )}

        {/* Title */}
        {entityTitle && (
          entityLink ? (
            <Link to={entityLink} className="block group/title">
              <h3 className="text-[1.6rem] md:text-[2rem] font-bold text-white/95 group-hover/title:text-[#c4a882] transition-colors leading-[1.15] tracking-[0.01em]"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
                {entityTitle}
              </h3>
            </Link>
          ) : (
            <h3 className="text-[1.6rem] md:text-[2rem] font-bold text-white/95 leading-[1.15] tracking-[0.01em]"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
              {entityTitle}
            </h3>
          )
        )}

        {/* Body — edit or display */}
        {isEditing ? (
          <div className="mt-3">
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)}
              rows={3} autoFocus
              className="w-full bg-transparent border-b border-white/[0.10] focus:border-white/[0.25] text-white/70 text-[15px] px-0 py-2 resize-none focus:outline-none transition-colors leading-relaxed" />
            <div className="flex items-center gap-3 mt-2">
              <button onClick={handleSaveEdit} disabled={isEditPending}
                className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-white/50 hover:text-white transition-colors font-semibold"
                style={{ fontFamily: "'Oswald', sans-serif" }}>
                <Check className="w-3 h-3" /> {isEditPending ? "Lagrer…" : "Lagre"}
              </button>
              <button onClick={() => { setIsEditing(false); setEditBody(post.body ?? ""); }}
                className="flex items-center gap-1.5 text-[11px] text-white/20 hover:text-white/40 transition-colors">
                <X className="w-3 h-3" /> Avbryt
              </button>
            </div>
          </div>
        ) : (
          post.body && (
            <p className="text-[15px] md:text-[16px] text-white/55 leading-[1.75] mt-3 max-w-[90%]">
              {post.body}
            </p>
          )
        )}

        {/* Author + like + comment toggle */}
        <div className="flex items-center justify-between mt-5">
          {author && (
            <Link to={`/profil/${author.slug}`} className="flex items-center gap-3 group/author">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt={author.display_name ?? ""}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/[0.08]" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <span className="text-[12px] font-bold text-white/50" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {author.display_name?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <span className="text-[12px] uppercase tracking-[0.12em] text-white/40 group-hover/author:text-white/70 transition-colors font-medium"
                style={{ fontFamily: "'Oswald', sans-serif" }}>
                {author.display_name}
              </span>
            </Link>
          )}

          <div className="flex items-center gap-4">
            {/* Comment toggle */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-white/20 hover:text-white/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Like */}
            <button
              onClick={() => { if (!user) return; toggleLike({ postId: post.id, liked }); }}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                liked ? "text-[#c8102e]" : "text-white/20 hover:text-white/50"
              } ${!user ? "cursor-default" : "cursor-pointer"}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 && (
                <span className="text-[11px] font-medium tracking-wide">{likeCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Inline comments */}
        {showComments && (
          <CommentSection feedPostId={post.id} />
        )}
      </article>

      <ImageLightbox
        images={allImages}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
