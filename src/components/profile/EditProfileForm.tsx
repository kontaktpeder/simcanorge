import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpsertPersonProfile } from "@/hooks/useMyPersonProfile";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart } from "lucide-react";

interface ProfileData {
  display_name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_public: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  favorite_brands?: string[] | null;
  visible_public?: boolean;
}

const BRAND_OPTIONS = ['Simca', 'Talbot', 'Matra', 'Peugeot', 'Citroën', 'Annet'];

const schema = z.object({
  display_name: z.string().min(2, "Navn må være minst 2 tegn"),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar_url: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  is_public: z.boolean(),
  contact_email: z.string().email("Ugyldig e-post").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  favorite_brands: z.array(z.string()).optional(),
  visible_public: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  profile: ProfileData;
  ownerProfile?: any; // kept for backwards compat but ignored
  onSuccess?: () => void;
}

export function EditProfileForm({ profile, onSuccess }: Props) {
  const { user } = useAuth();
  const { mutateAsync: upsertPerson, isPending } = useUpsertPersonProfile();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile.display_name,
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      avatar_url: profile.avatar_url ?? "",
      is_public: profile.is_public,
      contact_email: profile.contact_email ?? "",
      contact_phone: profile.contact_phone ?? "",
      favorite_brands: profile.favorite_brands ?? [],
      visible_public: profile.visible_public ?? false,
    },
  });

  const favoriteBrands = watch("favorite_brands") ?? [];

  const toggleBrand = (brand: string) => {
    const current = favoriteBrands;
    const next = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    setValue("favorite_brands", next, { shouldDirty: true });
  };

  async function onSubmit(values: FormValues) {
    if (!user) return;
    try {
      await upsertPerson({
        display_name: values.display_name,
        bio: values.bio || null,
        location: values.location || null,
        avatar_url: values.avatar_url || null,
        is_public: values.is_public,
        slug: profile.slug,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
        favorite_brands: (values.favorite_brands?.length ?? 0) > 0 ? values.favorite_brands : null,
        visible_public: values.visible_public ?? false,
      } as any);

      toast.success("Profil lagret");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message ?? "Noe gikk galt");
    }
  }

  const saving = isPending || isSubmitting;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-1">
        <Label htmlFor="display_name">Navn *</Label>
        <Input id="display_name" {...register("display_name")} />
        {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Brukernavn (slug)</Label>
        <p className="text-sm text-muted-foreground">bilgarasje.no/p/{profile.slug}</p>
        <p className="text-xs text-muted-foreground">Brukernavn kan ikke endres her.</p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" {...register("bio")} placeholder="Fortell litt om deg selv…" rows={3} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">Sted</Label>
        <Input id="location" {...register("location")} placeholder="Oslo, Norge" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="avatar_url">Profilbilde URL</Label>
        <Input id="avatar_url" {...register("avatar_url")} placeholder="https://…" />
        {errors.avatar_url && <p className="text-sm text-destructive">{errors.avatar_url.message}</p>}
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Offentlig profil</p>
          <p className="text-xs text-muted-foreground">Andre kan finne og se profilen din</p>
        </div>
        <Switch
          checked={watch("is_public")}
          onCheckedChange={(v) => setValue("is_public", v)}
        />
      </div>

      {/* Owner-specific fields */}
      <div className="border-t pt-5 space-y-5">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Entusiastprofil / Selgerinfo</p>

        <div className="space-y-1">
          <Label htmlFor="contact_email">Kontakt e-post</Label>
          <Input id="contact_email" type="email" {...register("contact_email")} placeholder="din@epost.no" />
          {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact_phone">Kontakttelefon</Label>
          <Input id="contact_phone" {...register("contact_phone")} placeholder="+47 000 00 000" />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Favorittmerker
          </Label>
          <div className="flex flex-wrap gap-2">
            {BRAND_OPTIONS.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => toggleBrand(brand)}
                className={`px-4 py-2 border-2 text-sm font-medium transition-all ${
                  favoriteBrands.includes(brand)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-foreground/40"
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Synlig som bileier</p>
            <p className="text-xs text-muted-foreground">Vises som eier på biler og i søk</p>
          </div>
          <Switch
            checked={watch("visible_public") ?? false}
            onCheckedChange={(v) => setValue("visible_public", v)}
          />
        </div>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Lagrer…" : "Lagre endringer"}
      </Button>
    </form>
  );
}
