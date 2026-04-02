import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { Heart, Car, ShoppingBag, CalendarDays, Pencil } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLikeFeedPost } from "@/hooks/useLikeFeedPost";
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

export function FeedCard({ post }: { post: FeedPost }) {
  const { user } = useAuth();
  const { mutate: toggleLike } = useLikeFeedPost();

  const likes = (post as any).feed_post_likes ?? [];
  const likeCount = likes.length;
  const liked = user ? likes.some((l: any) => l.user_id === user.id) : false;

  const author = (post as any).author;
  const car = (post as any).car;
  const marketItem = (post as any).marketplace_item;
  const event = (post as any).event;

  const entityTitle =
    car?.title ?? marketItem?.title ?? event?.title ?? post.snapshot_title ?? null;

  const heroImage =
    (car ? sortedFirst(car.car_images ?? []) : null) ??
    (marketItem ? sortedFirst(marketItem.marketplace_images ?? []) : null) ??
    (event ? sortedFirst(event.event_images ?? []) : null) ??
    post.snapshot_image_url ??
    null;

  const entityLink =
    car ? `/biler/${car.slug}` :
    marketItem ? `/markedsplass/${marketItem.slug}` :
    event ? `/e/${event.slug}` :
    null;

  const meta = TYPE_META[post.post_type] ?? TYPE_META.manual;
  const Icon = meta.icon;

  return (
    <div className="border border-white/[0.06] rounded-sm overflow-hidden bg-[#141210]">
      {/* Bilde */}
      {heroImage && (
        entityLink ? (
          <Link to={entityLink}>
            <img src={heroImage} alt="" className="w-full h-48 object-cover hover:opacity-90 transition-opacity" />
          </Link>
        ) : (
          <div>
            <img src={heroImage} alt="" className="w-full h-48 object-cover" />
          </div>
        )
      )}

      <div className="p-4">
        {/* Type + tid */}
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-[#a89880]/60">
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
          <span className="text-[10px] text-white/20">
            {formatDistanceToNow(new Date(post.created_at), { locale: nb, addSuffix: true })}
          </span>
        </div>

        {/* Tittel */}
        {entityTitle && (
          entityLink ? (
            <Link to={entityLink} className="block group">
              <p className="text-[15px] font-semibold text-white/80 group-hover:text-white transition-colors leading-snug mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}>
                {entityTitle}
              </p>
            </Link>
          ) : (
            <p className="text-[15px] font-semibold text-white/80 leading-snug mb-1"
              style={{ fontFamily: "'Oswald', sans-serif" }}>
              {entityTitle}
            </p>
          )
        )}

        {/* Brukerens melding */}
        {post.body && (
          <p className="text-[13px] text-white/50 leading-relaxed mt-1">
            {post.body}
          </p>
        )}

        {/* Forfatter + like */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
          {author && (
            <Link to={`/profil/${author.slug}`} className="flex items-center gap-2 group">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-[8px] text-white/30">
                    {author.display_name?.[0] ?? "?"}
                  </span>
                </div>
              )}
              <span className="text-[11px] text-white/30 group-hover:text-white/50 transition-colors">
                {author.display_name}
              </span>
            </Link>
          )}

          <button
            onClick={() => {
              if (!user) return;
              toggleLike({ postId: post.id, liked });
            }}
            className={`flex items-center gap-1.5 transition-colors ${
              liked ? "text-red-400" : "text-white/20 hover:text-white/50"
            } ${!user ? "cursor-default" : "cursor-pointer"}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-current" : ""}`} />
            {likeCount > 0 && (
              <span className="text-[11px]">{likeCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
