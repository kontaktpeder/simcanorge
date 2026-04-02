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

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const TYPE_META: Record<string, { label: string; icon: typeof Pencil; color: string }> = {
  manual:                { label: "Oppdatering",  icon: Pencil,       color: "text-white/40" },
  car_published:         { label: "Ny bil",        icon: Car,          color: "text-[#c8102e]" },
  car_update:            { label: "Bil oppdatert", icon: Car,          color: "text-[#c8102e]" },
  marketplace_published: { label: "Til salgs",     icon: ShoppingBag,  color: "text-[#c4a882]" },
  event_published:       { label: "Arrangement",   icon: CalendarDays, color: "text-[#c8102e]" },
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
  if (imgs.length === 0 && post.snapshot_image_url) return [{ url: post.snapshot_image_url }];
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

  const entityTitle = car?.title ?? marketItem?.title ?? event?.title ?? post.snapshot_title ?? null;
  const allImages = getAllImages(post);
  const heroImage = allImages[0]?.url ?? null;
  const entityLink =
    car ? `/biler/${car.slug}` :
    marketItem ? `/markedsplass/${marketItem.slug}` :
    event ? `/e/${event.slug}` : null;

  const meta = TYPE_META[post.post_type] ?? TYPE_META.manual;
  const Icon = meta.icon;
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { locale: nb, addSuffix: true });

  async function handleSaveEdit() {
    try {
      await editPost({ id: post.id, body: editBody });
      setIsEditing(false);
      toast.success("Innlegg oppdatert");
    } catch { toast.error("Noe gikk galt"); }
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
        {/* ── Author bar ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {author && (
              <Link to={`/profil/${author.slug}`} className="flex items-center gap-3 group/author">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.06]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center ring-2 ring-white/[0.06]">
                    <span className="text-[14px] font-bold text-white/50" style={oswald}>{author.display_name?.[0] ?? "?"}</span>
                  </div>
                )}
                <div>
                  <span className="text-[14px] uppercase tracking-[0.08em] text-white/80 group-hover/author:text-white font-bold block leading-tight" style={oswald}>
                    {author.display_name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Icon className={`w-3 h-3 ${meta.color}`} />
                    <span className={`text-[10px] uppercase tracking-[0.18em] font-bold ${meta.color}`} style={oswald}>
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-white/20">·</span>
                    <span className="text-[10px] text-white/25 tracking-wide">{timeAgo}</span>
                    {(post as any).updated_at && <span className="text-[10px] text-white/15 italic">redigert</span>}
                  </div>
                </div>
              </Link>
            )}
          </div>

          {isOwn && !isEditing && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/15 hover:text-white/50 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a1d21] border border-white/[0.08] py-1 z-20 min-w-[130px]">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors font-bold" style={oswald}>
                    <Pencil className="w-3 h-3" /> Rediger
                  </button>
                  <button onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-[#c8102e]/60 hover:text-[#c8102e] hover:bg-white/[0.04] transition-colors font-bold" style={oswald}>
                    <Trash2 className="w-3 h-3" /> Slett
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Image ── */}
        {heroImage && (
          <div className="relative cursor-pointer overflow-hidden mb-4" onClick={() => setLightboxOpen(true)}>
            <img src={heroImage} alt={entityTitle ?? ""}
              className="w-full h-[340px] sm:h-[420px] md:h-[480px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4 text-[12px] text-white/80 tracking-[0.12em] font-bold uppercase bg-black/40 backdrop-blur-sm px-3 py-1"
                style={oswald}>
                1 / {allImages.length}
              </div>
            )}
          </div>
        )}

        {/* ── Title ── */}
        {entityTitle && (
          entityLink ? (
            <Link to={entityLink} className="block group/title">
              <h3 className="text-[1.8rem] md:text-[2.4rem] uppercase font-bold text-white group-hover/title:text-[#c4a882] transition-colors leading-[1.05] tracking-[0.04em]"
                style={oswald}>
                {entityTitle}
              </h3>
            </Link>
          ) : (
            <h3 className="text-[1.8rem] md:text-[2.4rem] uppercase font-bold text-white leading-[1.05] tracking-[0.04em]"
              style={oswald}>
              {entityTitle}
            </h3>
          )
        )}

        {/* ── Body ── */}
        {isEditing ? (
          <div className="mt-3">
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} autoFocus
              className="w-full bg-transparent border-b-2 border-white/[0.12] focus:border-[#c4a882] text-white/80 text-[16px] px-0 py-3 resize-none focus:outline-none transition-colors leading-relaxed" />
            <div className="flex items-center gap-4 mt-3">
              <button onClick={handleSaveEdit} disabled={isEditPending}
                className="text-[12px] uppercase tracking-[0.15em] text-white bg-[#c8102e] hover:bg-[#a00d24] px-5 py-2 font-bold transition-colors" style={oswald}>
                <Check className="w-3.5 h-3.5 inline mr-1.5" />{isEditPending ? "Lagrer…" : "Lagre"}
              </button>
              <button onClick={() => { setIsEditing(false); setEditBody(post.body ?? ""); }}
                className="text-[12px] uppercase tracking-[0.12em] text-white/30 hover:text-white/60 font-bold transition-colors" style={oswald}>
                Avbryt
              </button>
            </div>
          </div>
        ) : (
          post.body && (
            <p className="text-[16px] md:text-[17px] text-white/50 leading-[1.8] mt-3">
              {post.body}
            </p>
          )
        )}

        {/* ── Actions bar ── */}
        <div className="flex items-center gap-6 mt-5">
          <button onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-white/60" : "text-white/20 hover:text-white/50"}`}>
            <MessageSquare className="w-4.5 h-4.5" />
            <span className="text-[11px] uppercase tracking-[0.12em] font-bold" style={oswald}>Kommentar</span>
          </button>

          <button
            onClick={() => { if (!user) return; toggleLike({ postId: post.id, liked }); }}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              liked ? "text-[#c8102e]" : "text-white/20 hover:text-white/50"
            } ${!user ? "cursor-default" : "cursor-pointer"}`}>
            <Heart className={`w-4.5 h-4.5 ${liked ? "fill-current" : ""}`} />
            {likeCount > 0 && <span className="text-[12px] font-bold" style={oswald}>{likeCount}</span>}
          </button>
        </div>

        {/* ── Inline comments ── */}
        {showComments && <CommentSection feedPostId={post.id} />}
      </article>

      <ImageLightbox images={allImages} initialIndex={0} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}
