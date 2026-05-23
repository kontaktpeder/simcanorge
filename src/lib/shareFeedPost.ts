import { toast } from "sonner";
import { PUBLIC_BASE_URL } from "@/lib/publicUrl";
import { getEntityHref, getEntityTitle } from "@/lib/feedPostPresentation";
import type { FeedPost } from "@/hooks/useFeedPosts";

/**
 * Foreløpig URL for et innlegg. Bruker entitetens permalink hvis vi har en,
 * ellers /hjem som feed-fallback.
 * TODO(PR-J): bytt til `/innlegg/${post.id}` når dedikert rute finnes.
 */
export function getFeedPostShareUrl(post: FeedPost): string {
  const path = getEntityHref(post);
  if (path) return `${PUBLIC_BASE_URL}${path}`;
  return `${PUBLIC_BASE_URL}/hjem`;
}

export async function shareFeedPost(post: FeedPost): Promise<void> {
  const url = getFeedPostShareUrl(post);
  const title = getEntityTitle(post) ?? "Innlegg på Bilgarasje";
  const shareData: ShareData = {
    title,
    text: "Sjekk dette på Bilgarasje",
    url,
  };

  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (!navigator.canShare || navigator.canShare(shareData))
    ) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Lenke kopiert!");
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lenke kopiert!");
    } catch {
      toast.error("Kunne ikke dele");
    }
  }
}
