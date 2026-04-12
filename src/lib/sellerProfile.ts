import type { OwnerProfile } from "@/hooks/useOwnerProfile";

/** Minimum fields required to create marketplace listings — no admin approval needed. */
export function isSellerMinimumComplete(p: OwnerProfile | null | undefined): boolean {
  if (!p) return false;
  return !!(
    p.display_name?.trim() &&
    p.slug?.trim() &&
    p.contact_email?.trim()
  );
}

export interface SellerMinimumStep {
  key: string;
  label: string;
  done: boolean;
}

export function getSellerMinimumSteps(p: OwnerProfile | null | undefined): SellerMinimumStep[] {
  return [
    { key: "name", label: "Navn", done: !!p?.display_name?.trim() },
    { key: "slug", label: "Brukernavn (profil-URL)", done: !!p?.slug?.trim() },
    { key: "email", label: "Kontakt e-post", done: !!p?.contact_email?.trim() },
  ];
}
