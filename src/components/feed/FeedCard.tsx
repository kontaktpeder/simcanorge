import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Heart, Car, ShoppingBag, CalendarDays, Pencil, MoreHorizontal, Trash2, Check, X, MessageSquare, MapPin, Camera, Eye } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useLikeFeedPost } from "@/hooks/useLikeFeedPost";
import { useEditFeedPost } from "@/hooks/useEditFeedPost";
import { useDeleteFeedPost } from "@/hooks/useDeleteFeedPost";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { CommentSection } from "@/components/comments/CommentSection";
import type { FeedPost } from "@/hooks/useFeedPosts";
import { resolveSpottingCoverFromRow } from "@/lib/spottingMedia";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const TYPE_META: Record<string, { label: string; icon: typeof Pencil; color: string }> = {
  manual:                { label: "Oppdatering",  icon: Pencil,       color: "text-white/40" },
  car_published:         { label: "Ny bil",        icon: Car,          color: "text-[#2dd4a8]" },
  car_update:            { label: "Bil oppdatert", icon: Car,          color: "text-[#2dd4a8]" },
  car_moment:            { label: "Øyeblikk",      icon: Camera,       color: "text-[#2dd4a8]" },
  car_spotting:          { label: "Spotting",      icon: Eye,          color: "text-[#2dd4a8]" },
  marketplace_published: { label: "Til salgs",     icon: ShoppingBag,  color: "text-[#2dd4a8]" },
  event_published:       { label: "Arrangement",   icon: CalendarDays, color: "text-[#2dd4a8]" },
};

function getAllImages(post: FeedPost) {
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;
  const sourceEvent = (post as any).source_event;

  // 1) Snapshot direkte på posten
  if (post.snapshot_image_url) {
    return [{ url: post.snapshot_image_url }];
  }

  // 2) Bilder fra source_event (car_event_images / data.image_url)
  if (sourceEvent) {
    const evImgs = (sourceEvent.car_event_images ?? [])
      .slice()
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((i: any) => ({ url: i.image_url, alt: i.alt_text ?? undefined }));
    if (evImgs.length > 0) return evImgs;
    const dataUrl = sourceEvent.data?.image_url;
    if (dataUrl) return [{ url: dataUrl }];
  }

  // 3) Eksisterende fallback: bil / annonse / event
  let imgs =
    car?.car_images?.slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    marketItem?.marketplace_images?.slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    event?.event_images?.slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map((i: any) => ({ url: i.image_url })) ??
    [];
  if (imgs.length === 0 && car) {
    const cover = resolveSpottingCoverFromRow(car);
    if (cover?.image_url) imgs = [{ url: cover.image_url }];
  }
  return imgs as { url: string; alt?: string }[];
}

export function FeedCard({ post, variant = "default" }: { post: FeedPost; variant?: "default" | "explore" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: myProfile } = useMyPersonProfile();
  const { mutate: toggleLike } = useLikeFeedPost();
  const { mutateAsync: editPost, isPending: isEditPending } = useEditFeedPost();
  const { mutate: deletePost } = useDeleteFeedPost();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(post.body ?? "");
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const likes = (post as any).feed_post_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l: any) => l.user_id === user.id) : false;
  const author = (post as any).author;
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;
  const isOwn = !!(myProfile && author?.id === myProfile.id);

  const isUnknownSpotting =
    car?.source === "spotting" &&
    (car?.identification_status === "unknown" || car?.identification_status === "needs_review");
  const entityTitle = isUnknownSpotting ? "Ukjent bil" : (car?.title ?? marketItem?.title ?? event?.title ?? post.snapshot_title ?? null);
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
    setShowMenu(false);
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    try {
      await new Promise<void>((resolve, reject) => {
        deletePost(post.id, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        });
      });
      toast.success("Innlegg slettet");
    } catch {
      toast.error("Noe gikk galt");
      setShowDeleteConfirm(false);
    }
  }

  const isSpotting = post.post_type === "car_spotting";
  const cardClickable = !!entityLink && !isSpotting;

  function handleCardClick(e: import("react").MouseEvent<HTMLElement>) {
    if (!cardClickable) return;
    if (isEditing || showDeleteConfirm || showMenu) return;
    const target = e.target as HTMLElement;
    if (target.closest('a,button,textarea,input,select,label,[role="button"]')) return;
    if (window.getSelection()?.toString()) return;
    navigate(entityLink!);
  }

  // ─── Explore variant: image-first, compact ───
  if (variant === "explore") {
    const carBrand = (car as any)?.brand as string | null;
    const carModel = (car as any)?.model as string | null;
    const carYear = (car as any)?.year as number | null;
    const carTags = ((car as any)?.tags ?? []) as string[];
    const subline = [carBrand, carModel, carYear].filter(Boolean).join(" • ");
    const bodyText = post.body ?? (post as any).source_event?.description ?? null;

    return (
      <>
        <article className={`group ${cardClickable ? 'cursor-pointer' : ''}`} onClick={handleCardClick}>
          {/* Image */}
          <div className="relative overflow-hidden rounded-lg mb-3 bg-white/[0.04] border border-white/[0.06]">
            {heroImage ? (
              entityLink ? (
                <Link to={entityLink} className="block">
                  <img src={heroImage} alt={entityTitle ?? ""}
                    className="w-full aspect-[4/5] sm:aspect-video object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
                </Link>
              ) : (
                <img src={heroImage} alt={entityTitle ?? ""}
                  className="w-full aspect-[4/5] sm:aspect-video object-cover" />
              )
            ) : (
              <div className="w-full aspect-[4/5] sm:aspect-video flex items-center justify-center">
                <Car className="w-12 h-12 text-white/15" />
              </div>
            )}

            {/* Type badge overlay top-left */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm">
              <Icon className={`w-3 h-3 ${meta.color}`} />
              <span className={`text-[9px] uppercase tracking-[0.16em] font-bold ${meta.color}`} style={oswald}>
                {meta.label}
              </span>
            </div>

            {/* Own post menu */}
            {isOwn && !isEditing && !showDeleteConfirm && (
              <div className="absolute top-2 right-2">
                <button onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-md bg-black/60 backdrop-blur-sm text-white/70 hover:text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-[#1a2332] border border-white/[0.1] py-1 z-20 min-w-[130px] rounded-lg shadow-lg">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-white/50 hover:text-white hover:bg-white/[0.06] font-bold" style={oswald}>
                      <Pencil className="w-3 h-3" /> Rediger
                    </button>
                    <button onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-red-500/60 hover:text-red-400 hover:bg-white/[0.06] font-bold" style={oswald}>
                      <Trash2 className="w-3 h-3" /> Slett
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          {entityTitle && (
            entityLink ? (
              <Link to={entityLink}>
                <h3 className="text-[1.05rem] sm:text-[1.2rem] font-bold text-white hover:text-[#2dd4a8] transition-colors leading-snug" style={oswald}>
                  {entityTitle}
                </h3>
              </Link>
            ) : (
              <h3 className="text-[1.05rem] sm:text-[1.2rem] font-bold text-white leading-snug" style={oswald}>
                {entityTitle}
              </h3>
            )
          )}

          {/* Subline */}
          {subline && (
            <p className="text-[12px] uppercase tracking-[0.1em] text-white/45 mt-0.5" style={oswald}>
              {subline}
            </p>
          )}

          {/* Body */}
          {isEditing ? (
            <div className="mt-2">
              <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} autoFocus
                className="w-full bg-transparent border-b-2 border-white/[0.12] focus:border-[#2dd4a8] text-white/80 text-[14px] px-0 py-2 resize-none focus:outline-none" />
              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleSaveEdit} disabled={isEditPending}
                  className="text-[11px] uppercase tracking-[0.12em] text-[#0c1117] px-4 py-1.5 font-bold rounded"
                  style={{ ...oswald, background: 'linear-gradient(135deg, #2dd4a8, #14b8a6)' }}>
                  <Check className="w-3 h-3 inline mr-1" />{isEditPending ? "Lagrer…" : "Lagre"}
                </button>
                <button onClick={() => { setIsEditing(false); setEditBody(post.body ?? ""); }}
                  className="text-[11px] uppercase tracking-[0.1em] text-white/40 hover:text-white/70 font-bold" style={oswald}>
                  Avbryt
                </button>
              </div>
            </div>
          ) : (
            bodyText && (
              <p className="text-[13.5px] text-white/65 leading-snug mt-2 line-clamp-2">
                {bodyText}
              </p>
            )
          )}

          {/* Tags */}
          {carTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {carTags.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] uppercase tracking-[0.1em] text-[#2dd4a8]/80" style={oswald}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Meta row */}
          {author && (
            <Link to={`/profil/${author.slug}`} className="flex items-center gap-2 mt-3 group/author">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white/50" style={oswald}>{author.display_name?.[0] ?? "?"}</span>
                </div>
              )}
              <span className="text-[11px] uppercase tracking-[0.08em] text-white/55 group-hover/author:text-white font-bold" style={oswald}>
                {author.display_name}
              </span>
              <span className="text-[10px] text-white/20">·</span>
              <span className="text-[10px] text-white/35">{timeAgo}</span>
            </Link>
          )}

          {/* Inline delete confirm */}
          {showDeleteConfirm && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-red-400 font-bold" style={oswald}>Slett?</span>
              <button onClick={confirmDelete}
                className="text-[11px] uppercase tracking-[0.12em] text-white bg-red-600 hover:bg-red-700 px-3 py-1 font-bold rounded" style={oswald}>
                Ja, slett
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white/25 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-5 mt-3">
            <button onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 transition-colors ${showComments ? "text-white/60" : "text-white/25 hover:text-white/55"}`}>
              <MessageSquare className="w-4 h-4" />
              <span className="text-[11px] uppercase tracking-[0.1em] font-bold" style={oswald}>Kommentar</span>
            </button>
            <button
              onClick={() => { if (!user) return; toggleLike({ postId: post.id, liked }); }}
              className={`flex items-center gap-1.5 transition-colors ${liked ? "text-red-500" : "text-white/25 hover:text-white/55"}`}>
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 && <span className="text-[12px] font-bold" style={oswald}>{likeCount}</span>}
            </button>
          </div>

          {showComments && <CommentSection feedPostId={post.id} />}
        </article>
        <ImageLightbox images={allImages} initialIndex={0} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
      </>
    );
  }

  return (
    <>
      <article className={`group ${cardClickable ? 'cursor-pointer' : ''}`} onClick={handleCardClick}>
        {/* ── Author bar ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {author && (
              <Link to={`/profil/${author.slug}`} className="flex items-center gap-3 group/author">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/[0.08]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center ring-2 ring-white/[0.08]">
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
                    <span className="text-[10px] text-white/30 tracking-wide">{timeAgo}</span>
                    {(post as any).updated_at && <span className="text-[10px] text-white/20 italic">redigert</span>}
                  </div>
                </div>
              </Link>
            )}
          </div>

          {isOwn && !isEditing && !showDeleteConfirm && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-white/15 hover:text-white/50 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1a2332] border border-white/[0.1] py-1 z-20 min-w-[130px] rounded-lg shadow-lg">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-white/50 hover:text-white hover:bg-white/[0.06] transition-colors font-bold" style={oswald}>
                    <Pencil className="w-3 h-3" /> Rediger
                  </button>
                  <button onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] text-red-500/60 hover:text-red-400 hover:bg-white/[0.06] transition-colors font-bold" style={oswald}>
                    <Trash2 className="w-3 h-3" /> Slett
                  </button>
                </div>
              )}
            </div>
          )}

          {showDeleteConfirm && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.12em] text-red-400 font-bold" style={oswald}>Slett?</span>
              <button onClick={confirmDelete}
                className="text-[11px] uppercase tracking-[0.12em] text-white bg-red-600 hover:bg-red-700 px-3 py-1 font-bold transition-colors rounded" style={oswald}>
                Ja, slett
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white/25 hover:text-white/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Image ── */}
        {heroImage && (
          <div className="relative overflow-hidden mb-4 rounded-lg">
            {entityLink ? (
              <Link to={entityLink} className="block">
                <img src={heroImage} alt={entityTitle ?? ""}
                  className="w-full h-[340px] sm:h-[420px] md:h-[480px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              </Link>
            ) : (
              <img src={heroImage} alt={entityTitle ?? ""}
                className="w-full h-[340px] sm:h-[420px] md:h-[480px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
            )}

            {event && (event.starts_at || event.location) && (
              <div className="absolute bottom-0 right-0 p-4 text-right" style={{ background: 'linear-gradient(to top left, rgba(0,0,0,0.75), transparent)' }}>
                {event.starts_at && (
                  <p className="text-[1.1rem] md:text-[1.4rem] uppercase font-bold text-white leading-tight tracking-[0.06em]" style={oswald}>
                    {format(new Date(event.starts_at), "d. MMMM yyyy", { locale: nb })}
                  </p>
                )}
                {event.starts_at && (
                  <p className="text-[1rem] md:text-[1.2rem] uppercase font-bold text-white/70 tracking-[0.08em]" style={oswald}>
                    {format(new Date(event.starts_at), "HH:mm", { locale: nb })}
                  </p>
                )}
                {event.location && (
                  <p className="text-[1rem] md:text-[1.2rem] uppercase font-bold text-[#2dd4a8] tracking-[0.08em] flex items-center gap-1.5 justify-end mt-0.5" style={oswald}>
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Title ── */}
        {entityTitle && (
          entityLink ? (
            <Link to={entityLink} className="block group/title">
              <h3 className="text-[1.8rem] md:text-[2.4rem] uppercase font-bold text-white group-hover/title:text-[#2dd4a8] transition-colors leading-[1.05] tracking-[0.04em]"
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

        {/* ── Event organizer ── */}
        {event && (() => {
          const orgName = event.owner_page?.title || event.owner_profile?.display_name;
          const orgSlug = event.owner_page?.slug ? `/s/${event.owner_page.slug}` : event.owner_profile?.slug ? `/profil/${event.owner_profile.slug}` : null;
          const orgAvatar = event.owner_page?.logo_url || event.owner_profile?.avatar_url || null;
          if (!orgName) return null;
          const inner = (
            <span className="flex items-center gap-2">
              {orgAvatar ? (
                <img src={orgAvatar} alt="" className="w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[11px] font-bold text-white/50" style={oswald}>{orgName[0]}</span>
              )}
              <span className="text-white/50 group-hover/org:text-white transition-colors">{orgName}</span>
            </span>
          );
          return (
            <div className="mt-2 text-[13px] uppercase tracking-[0.1em]" style={oswald}>
              <span className="text-white/25 mr-1.5">Arrangert av</span>
              {orgSlug ? <Link to={orgSlug} className="group/org inline-flex">{inner}</Link> : inner}
            </div>
          );
        })()}

        {/* ── Body ── */}
        {isEditing ? (
          <div className="mt-3">
            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} autoFocus
              className="w-full bg-transparent border-b-2 border-white/[0.12] focus:border-[#2dd4a8] text-white/80 text-[16px] px-0 py-3 resize-none focus:outline-none transition-colors leading-relaxed" />
            <div className="flex items-center gap-4 mt-3">
              <button onClick={handleSaveEdit} disabled={isEditPending}
                className="text-[12px] uppercase tracking-[0.15em] text-[#0c1117] px-5 py-2 font-bold transition-colors rounded"
                style={{ ...oswald, background: 'linear-gradient(135deg, #2dd4a8, #14b8a6)' }}>
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
            <p className="text-[16px] md:text-[17px] text-white/55 leading-[1.8] mt-3">
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
              liked ? "text-red-500" : "text-white/20 hover:text-white/50"
            } ${!user ? "cursor-default" : "cursor-pointer"}`}>
            <Heart className={`w-4.5 h-4.5 ${liked ? "fill-current" : ""}`} />
            {likeCount > 0 && <span className="text-[12px] font-bold" style={oswald}>{likeCount}</span>}
          </button>
        </div>

        {showComments && <CommentSection feedPostId={post.id} />}
      </article>

      <ImageLightbox images={allImages} initialIndex={0} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />
    </>
  );
}
