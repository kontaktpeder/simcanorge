import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { nb } from "date-fns/locale";
import { MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X, Share2 } from "lucide-react";
import type { FeedPost } from "@/hooks/useFeedPosts";
import {
  getPostImages,
  getPostBody,
  postHasMedia,
  getEntityHref,
  getEntityTitle,
  getCarSubline,
  getCarUnknownPrimaryLabel,
  CAR_UNKNOWN_SECONDARY_LABEL,
  isCarUnknown,
  shouldShowTypeBadge,
  getTypeBadgeLabel,
  type CarRow,
} from "@/lib/feedPostPresentation";
import { feedThemeTokens, type FeedTheme } from "./feedTheme";

type Author = {
  id?: string;
  slug?: string;
  display_name?: string;
  avatar_url?: string | null;
};

export type FeedPostCardProps = {
  post: FeedPost;
  theme?: FeedTheme;
  author?: Author | null;
  isOwn?: boolean;
  isEditing?: boolean;
  editBody?: string;
  onEditBodyChange?: (v: string) => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  isEditPending?: boolean;
  showMenu?: boolean;
  onToggleMenu?: () => void;
  onStartEdit?: () => void;
  onDelete?: () => void;
  showDeleteConfirm?: boolean;
  onConfirmDelete?: () => void;
  onCancelDelete?: () => void;
  showComments?: boolean;
  onToggleComments?: () => void;
  onImageClick?: () => void;
  onShare?: () => void;
  onKnowCar?: () => void;
  children?: ReactNode;
};

export function FeedPostCard({
  post,
  theme = "dark",
  author,
  isOwn,
  isEditing,
  editBody = "",
  onEditBodyChange,
  onSaveEdit,
  onCancelEdit,
  isEditPending,
  showMenu,
  onToggleMenu,
  onStartEdit,
  onDelete,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
  showComments,
  onToggleComments,
  onImageClick,
  onShare,
  onKnowCar,
  children,
}: FeedPostCardProps) {
  const t = feedThemeTokens(theme);
  const images = getPostImages(post);
  const hasMedia = postHasMedia(post);
  const heroImage = images[0]?.url ?? null;
  const body = getPostBody(post);
  const car = (post as { car?: CarRow }).car ?? null;
  const carUnknown = isCarUnknown(car);
  const entityHref = carUnknown ? null : getEntityHref(post);
  // Anonymiser entitetsdata for upubliserte biler — vis kun «Ukjent bil» under media.
  const entityTitle = carUnknown ? null : getEntityTitle(post);
  const subline = carUnknown ? null : getCarSubline(post);
  const unknownPrimary = getCarUnknownPrimaryLabel(car);
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { locale: nb, addSuffix: true });
  const showBadge = shouldShowTypeBadge(post.post_type);
  const badgeLabel = getTypeBadgeLabel(post.post_type);

  return (
    <article className="group">

      {/* Author + meta */}
      <div className="flex items-start justify-between mb-3 gap-3">
        {author ? (
          <Link
            to={`/profil/${author.slug}`}
            className="flex items-center gap-2.5 min-w-0 group/author"
            onClick={(e) => e.stopPropagation()}
          >
            {author.avatar_url ? (
              <img
                src={author.avatar_url}
                alt=""
                className={`w-9 h-9 rounded-full object-cover ring-1 ${t.isLight ? "ring-black/10" : "ring-white/10"}`}
              />
            ) : (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${t.isLight ? "bg-neutral-200" : "bg-white/[0.08]"}`}>
                <span className={`text-[12px] font-bold ${t.isLight ? "text-neutral-600" : "text-white/50"}`} style={t.isLight ? t.inter : t.oswald}>
                  {author.display_name?.[0] ?? "?"}
                </span>
              </div>
            )}
            <div className="min-w-0 flex flex-col leading-tight">
              <span
                className={`text-[13px] font-bold truncate transition-colors ${t.author}`}
                style={t.isLight ? t.inter : t.oswald}
              >
                {author.display_name}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {showBadge && badgeLabel && (
                  <>
                    <span
                      className="text-[9px] uppercase tracking-[0.16em] font-bold px-1.5 py-0.5 rounded"
                      style={{ ...t.badgeStyle, ...(t.isLight ? t.inter : t.oswald) }}
                    >
                      {badgeLabel}
                    </span>
                    <span className={t.subtle}>·</span>
                  </>
                )}
                <span className={`text-[11px] ${t.muted}`} style={t.isLight ? t.inter : undefined}>
                  {timeAgo}
                </span>
              </div>
            </div>
          </Link>
        ) : (
          <span className={`text-[11px] ${t.muted}`} style={t.isLight ? t.inter : undefined}>
            {timeAgo}
          </span>
        )}

        {isOwn && !isEditing && !showDeleteConfirm && onToggleMenu && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
              className={`p-1.5 rounded-md transition-colors ${t.isLight ? "text-neutral-400 hover:text-neutral-700" : "text-white/25 hover:text-white/60"}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div
                className={`absolute right-0 top-full mt-1 py-1 z-20 min-w-[130px] rounded-lg shadow-lg ${
                  t.isLight ? "bg-white border border-black/[0.08]" : "bg-[#1a2332] border border-white/[0.1]"
                }`}
              >
                {onStartEdit && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
                    className={`flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] font-bold ${
                      t.isLight ? "text-neutral-600 hover:text-neutral-900 hover:bg-black/[0.04]" : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    style={t.isLight ? t.inter : t.oswald}
                  >
                    <Pencil className="w-3 h-3" /> Rediger
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className={`flex items-center gap-2 w-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] font-bold ${
                      t.isLight ? "text-red-600 hover:text-red-700 hover:bg-black/[0.04]" : "text-red-500/60 hover:text-red-400 hover:bg-white/[0.06]"
                    }`}
                    style={t.isLight ? t.inter : t.oswald}
                  >
                    <Trash2 className="w-3 h-3" /> Slett
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media — only if present */}
      {hasMedia && heroImage && (
        <div className={`relative overflow-hidden rounded-xl mb-3 border ${t.cardBorder}`}>
          {entityHref ? (
            <Link to={entityHref} onClick={(e) => e.stopPropagation()} className="block">
              <img
                src={heroImage}
                alt={entityTitle ?? ""}
                className="w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </Link>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onImageClick?.(); }}
              className="block w-full"
            >
              <img
                src={heroImage}
                alt={entityTitle ?? ""}
                className="w-full aspect-[4/5] object-cover"
              />
            </button>
          )}
        </div>
      )}

      {/* Entity title */}
      {entityTitle && (
        entityHref ? (
          <Link to={entityHref} onClick={(e) => e.stopPropagation()}>
            <h3
              className={`text-[1.05rem] sm:text-[1.25rem] font-extrabold leading-snug tracking-tight transition-colors ${t.titleColor}`}
              style={t.isLight ? t.inter : t.oswald}
            >
              {entityTitle}
            </h3>
          </Link>
        ) : (
          <h3
            className={`text-[1.05rem] sm:text-[1.25rem] font-extrabold leading-snug tracking-tight ${t.isLight ? "text-[#2b2b2b]" : "text-white"}`}
            style={t.isLight ? t.inter : t.oswald}
          >
            {entityTitle}
          </h3>
        )
      )}

      {subline && (
        <p
          className={`text-[12px] uppercase tracking-[0.12em] mt-0.5 font-semibold ${t.muted}`}
          style={t.isLight ? t.inter : t.oswald}
        >
          {subline}
        </p>
      )}

      {unknownPrimary && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={`inline-block text-[10px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-full border ${t.draftChip}`}
            style={t.isLight ? t.inter : t.oswald}
          >
            {unknownPrimary}
          </span>
          {onKnowCar && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onKnowCar(); }}
              className={`text-[10px] uppercase tracking-[0.14em] font-bold underline-offset-4 hover:underline transition-colors ${
                t.isLight ? "text-neutral-700 hover:text-neutral-900" : "text-white/70 hover:text-[#34eab8]"
              }`}
              style={t.isLight ? t.inter : t.oswald}
            >
              {CAR_UNKNOWN_SECONDARY_LABEL}
            </button>
          )}
        </div>
      )}


      {/* Body */}
      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={editBody}
            onChange={(e) => onEditBodyChange?.(e.target.value)}
            rows={4}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-[15px] leading-relaxed focus:outline-none ${
              t.isLight
                ? "border-black/10 text-neutral-900 focus:border-[#fcc419] bg-white"
                : "border-white/15 bg-white/[0.04] text-white focus:border-[#2dd4a8]"
            }`}
            style={t.inter}
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSaveEdit?.(); }}
              disabled={isEditPending}
              className={`text-[11px] uppercase tracking-wide font-bold px-4 py-1.5 rounded-full ${
                t.isLight ? "bg-[#2b2b2b] text-[#fcc419]" : "text-[#070b10]"
              }`}
              style={t.isLight ? t.inter : { ...t.oswald, background: "linear-gradient(135deg, #2dd4a8, #14b8a6)" }}
            >
              <Check className="w-3 h-3 inline mr-1" />
              {isEditPending ? "Lagrer…" : "Lagre"}
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCancelEdit?.(); }}
              className={`text-[11px] font-bold uppercase ${t.muted}`}
              style={t.isLight ? t.inter : t.oswald}
            >
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        body && (
          <p
            className={`text-[15px] sm:text-[16px] leading-relaxed ${hasMedia || entityTitle ? "mt-2" : "mt-0"} ${t.body}`}
            style={t.isLight ? t.inter : t.oswaldLight}
          >
            {body}
          </p>
        )
      )}

      {showDeleteConfirm && (
        <div className="flex items-center gap-3 mt-3">
          <span className={`text-[11px] uppercase font-bold ${t.isLight ? "text-red-600" : "text-red-400"}`} style={t.isLight ? t.inter : t.oswald}>
            Slett?
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onConfirmDelete?.(); }}
            className="text-[11px] uppercase font-bold text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-full"
            style={t.isLight ? t.inter : t.oswald}
          >
            Ja, slett
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCancelDelete?.(); }}
            className={t.muted}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Actions */}
      {onToggleComments && (
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleComments(); }}
            className={`flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wide transition-colors ${
              showComments
                ? (t.isLight ? "text-neutral-800" : "text-white/60")
                : t.muted
            }`}
            style={t.isLight ? t.inter : t.oswald}
          >
            <MessageSquare className="w-4 h-4" />
            Kommentar
          </button>
        </div>
      )}

      {children}
    </article>
  );
}
