import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUpsertPersonProfile } from "@/hooks/useMyPersonProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const schema = z.object({
  display_name: z.string().min(2, "Navn må være minst 2 tegn"),
  slug: z
    .string()
    .min(2, "Brukernavn må være minst 2 tegn")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Kun små bokstaver, tall og bindestrek"),
  bio: z.string().optional(),
  location: z.string().optional(),
  is_public: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CompleteProfileForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useUpsertPersonProfile();
  const slugManuallyEdited = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_public: false },
  });

  const displayName = watch("display_name");

  useEffect(() => {
    if (!slugManuallyEdited.current && displayName) {
      setValue("slug", toSlug(displayName), { shouldValidate: false });
    }
  }, [displayName, setValue]);

  const slugProps = register("slug", {
    onChange: () => {
      slugManuallyEdited.current = true;
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await mutateAsync({ display_name: values.display_name, slug: values.slug, bio: values.bio, location: values.location, is_public: values.is_public });
      // Wait for cache to update before navigating so RequirePersonProfile sees the new profile
      await queryClient.invalidateQueries({ queryKey: ["person_profile", "me"] });
      toast.success("Profil opprettet!");
      navigate("/dashboard/min-profil");
    } catch (err: any) {
      if (err?.code === "23505" || err?.message?.includes("unique")) {
        toast.error("Dette brukernavnet er allerede i bruk. Velg et annet.");
      } else {
        toast.error("Noe gikk galt. Prøv igjen.");
      }
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Fullfør profilen din</CardTitle>
        <CardDescription>Dette er din offentlige profil på Bilgarasjen.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="display_name">Navn *</Label>
            <Input id="display_name" {...register("display_name")} placeholder="Ditt navn" />
            {errors.display_name && <p className="text-sm text-destructive">{errors.display_name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="slug">Brukernavn *</Label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">bilgarasje.no/p/</span>
              <Input id="slug" {...slugProps} placeholder="ditt-navn" />
            </div>
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...register("bio")} placeholder="Fortell litt om deg selv" rows={3} />
            <p className="text-xs text-muted-foreground">En god bio øker sjansen for å få sidetilgang</p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="location">Sted</Label>
            <Input id="location" {...register("location")} placeholder="Oslo, Norge" />
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

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Oppretter profil…" : "Kom i gang"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
