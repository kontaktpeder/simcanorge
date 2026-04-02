import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Heart, Car, ShoppingBag, CalendarDays, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLikeFeedPost } from "@/hooks/useLikeFeedPost";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { FeedPost } from "@/hooks/useFeedPosts";

const TYPE_META: Record<string, { label: string; icon: typeof Pencil }> = {
  manual:                { label: "Oppdatering",  icon: Pencil },
  car_published:         { label: "Ny bil",        icon: Car },
  car_update:            { label: "Bil oppdatert", icon: Car },
  marketplace_published: { label: "Til salgs",     icon: ShoppingBag },
  event_published:       { label: "Arrangement",   icon: CalendarDays },
};

function sortedFirst(imgs: { image_url: string; sort_order: number | null }[]) {
  return [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]?.image_url ?? null;
}

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
  const { mutate: toggleLike } = useLikeFeedPost();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const likes = (post as any).feed_post_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l: any) => l.user_id === user.id) : false;

  const author = (post as any).author;
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;

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

  return (
    <>
      <article className="group relative overflow-hidden rounded bg-[#1a1d21] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(212,175,55,0.08)]">

        {/* Image with click-to-lightbox */}
        {heroImage && (
          <div
            className="relative cursor-pointer overflow-hidden"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={heroImage}
              alt={entityTitle ?? ""}
              className="w-full h-56 sm:h-64 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
            {/* Cinematic gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1d21] via-transparent to-transparent opacity-60" />

            {/* Image count badge */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white/90 text-[11px] px-2.5 py-1 rounded-full tracking-wide">
                1 / {allImages.length}
              </div>
            )}

            {/* Type badge floating on image */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-[#d4af37] text-[10px] uppercase tracking-[0.15em] font-semibold px-3 py-1.5 rounded-full">
                <Icon className="w-3 h-3" />
                {meta.label}
              </span>
            </div>
          </div>
        )}

        <div className="p-5">
          {/* No-image type badge */}
          {!heroImage && (
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#d4af37]/80 font-semibold">
                <Icon className="w-3.5 h-3.5" />
                {meta.label}
              </span>
              <span className="text-[11px] text-white/30">·</span>
              <span className="text-[11px] text-white/30">{timeAgo}</span>
            </div>
          )}

          {/* Title */}
          {entityTitle && (
            entityLink ? (
              <Link to={entityLink} className="block group/title">
                <h3
                  className="text-[1.25rem] md:text-[1.4rem] font-bold text-white group-hover/title:text-[#d4af37] transition-colors leading-tight tracking-[0.02em]"
                  style={{ fontFamily: "'DM Serif Display', 'Oswald', serif" }}
                >
                  {entityTitle}
                </h3>
              </Link>
            ) : (
              <h3
                className="text-[1.25rem] md:text-[1.4rem] font-bold text-white leading-tight tracking-[0.02em]"
                style={{ fontFamily: "'DM Serif Display', 'Oswald', serif" }}
              >
                {entityTitle}
              </h3>
            )
          )}

          {/* Body */}
          {post.body && (
            <p className="text-[15px] text-white/65 leading-[1.7] mt-2.5 font-light">
              {post.body}
            </p>
          )}

          {/* Author + meta + like */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
            {author && (
              <Link to={`/profil/${author.slug}`} className="flex items-center gap-2.5 group/author">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.display_name ?? ""}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10 group-hover/author:ring-[#d4af37]/40 transition-all"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#d4af37]/10 flex items-center justify-center ring-1 ring-white/10">
                    <span className="text-[11px] font-semibold text-[#d4af37]">
                      {author.display_name?.[0] ?? "?"}
                    </span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium text-white/80 group-hover/author:text-white transition-colors leading-tight">
                    {author.display_name}
                  </span>
                  {heroImage && (
                    <span className="text-[11px] text-white/30 leading-tight">
                      {timeAgo}
                    </span>
                  )}
                </div>
              </Link>
            )}

            <button
              onClick={() => {
                if (!user) return;
                toggleLike({ postId: post.id, liked });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
                liked
                  ? "text-red-400 bg-red-400/10"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              } ${!user ? "cursor-default" : "cursor-pointer"}`}
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 && (
                <span className="text-[12px] font-medium">{likeCount}</span>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Fullscreen lightbox */}
      <ImageLightbox
        images={allImages}
        initialIndex={0}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
