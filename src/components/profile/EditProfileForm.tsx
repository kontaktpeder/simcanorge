import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useUpsertPersonProfile } from "@/hooks/useMyPersonProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { Database } from "@/integrations/supabase/types";

type PersonProfile = Database["public"]["Tables"]["person_profiles"]["Row"];

const schema = z.object({
  display_name: z.string().min(2, "Navn må være minst 2 tegn"),
  bio: z.string().optional(),
  location: z.string().optional(),
  avatar_url: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  is_public: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function EditProfileForm({ profile, onSuccess }: { profile: PersonProfile; onSuccess?: () => void }) {
  const { mutateAsync, isPending } = useUpsertPersonProfile();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile.display_name,
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      avatar_url: profile.avatar_url ?? "",
      is_public: profile.is_public,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutateAsync({
        display_name: values.display_name,
        bio: values.bio || null,
        location: values.location || null,
        avatar_url: values.avatar_url || null,
        is_public: values.is_public,
        slug: profile.slug,
      });
      toast.success("Profil oppdatert");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message ?? "Noe gikk galt");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      <Button type="submit" disabled={isPending}>
        {isPending ? "Lagrer…" : "Lagre endringer"}
      </Button>
    </form>
  );
}
