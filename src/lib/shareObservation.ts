import { PUBLIC_BASE_URL } from "@/lib/publicUrl";
import { toast } from "sonner";

export function getCarPublicUrl(slug: string): string {
  return `${PUBLIC_BASE_URL}/biler/${slug}`;
}

export async function shareObservation(slug: string, title?: string): Promise<void> {
  const url = getCarPublicUrl(slug);
  const shareData: ShareData = {
    title: title ?? "Observasjon på Bilgarasje",
    text: "Sjekk ut denne bilen i arkivet",
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
