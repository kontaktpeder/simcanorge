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
      <article className="group">
        {/* ── Type label ── */}
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-3.5 h-3.5 text-[#c8102e]" />
          <span
            className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#c8102e]"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {meta.label}
          </span>
          <span className="text-[10px] text-white/20 tracking-[0.1em] uppercase">{timeAgo}</span>
        </div>

        {/* ── Image ── */}
        {heroImage && (
          <div
            className="relative cursor-pointer overflow-hidden mb-5"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={heroImage}
              alt={entityTitle ?? ""}
              className="w-full h-[320px] sm:h-[400px] md:h-[460px] object-cover transition-transform duration-700 group-hover:scale-[1.015]"
            />
            {allImages.length > 1 && (
              <div className="absolute bottom-4 right-4 text-[11px] text-white/70 tracking-[0.1em] font-medium uppercase"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                1 / {allImages.length}
              </div>
            )}
          </div>
        )}

        {/* ── Title ── */}
        {entityTitle && (
          entityLink ? (
            <Link to={entityLink} className="block group/title">
              <h3
                className="text-[1.6rem] md:text-[2rem] font-bold text-white/95 group-hover/title:text-[#c4a882] transition-colors leading-[1.15] tracking-[0.01em]"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                {entityTitle}
              </h3>
            </Link>
          ) : (
            <h3
              className="text-[1.6rem] md:text-[2rem] font-bold text-white/95 leading-[1.15] tracking-[0.01em]"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {entityTitle}
            </h3>
          )
        )}

        {/* ── Body ── */}
        {post.body && (
          <p className="text-[15px] md:text-[16px] text-white/55 leading-[1.75] mt-3 max-w-[90%]">
            {post.body}
          </p>
        )}

        {/* ── Author + like row ── */}
        <div className="flex items-center justify-between mt-5">
          {author && (
            <Link to={`/profil/${author.slug}`} className="flex items-center gap-3 group/author">
              {author.avatar_url ? (
                <img
                  src={author.avatar_url}
                  alt={author.display_name ?? ""}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/[0.08]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
                  <span
                    className="text-[12px] font-bold text-white/50"
                    style={{ fontFamily: "'Oswald', sans-serif" }}
                  >
                    {author.display_name?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <span
                className="text-[12px] uppercase tracking-[0.12em] text-white/40 group-hover/author:text-white/70 transition-colors font-medium"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {author.display_name}
              </span>
            </Link>
          )}

          <button
            onClick={() => {
              if (!user) return;
              toggleLike({ postId: post.id, liked });
            }}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              liked
                ? "text-[#c8102e]"
                : "text-white/20 hover:text-white/50"
            } ${!user ? "cursor-default" : "cursor-pointer"}`}
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
            {likeCount > 0 && (
              <span className="text-[11px] font-medium tracking-wide">{likeCount}</span>
            )}
          </button>
        </div>
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
