import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pageTypeOptions = [
  { value: "club", label: "Klubb" },
  { value: "dealer", label: "Forhandler" },
  { value: "museum", label: "Museum" },
  { value: "collection", label: "Samling" },
  { value: "workshop", label: "Verksted" },
  { value: "business", label: "Bedrift" },
  { value: "garage", label: "Garasje" },
] as const;

const schema = z.object({
  page_type: z.enum(["club", "dealer", "museum", "collection", "workshop", "business", "garage"]),
  title: z.string().min(2, "Navn må være minst 2 tegn"),
  slug: z
    .string()
    .min(2, "Adresse må være minst 2 tegn")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Kun små bokstaver, tall og bindestrek"),
  tagline: z.string().optional(),
  about: z.string().optional(),
  logo_url: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  cover_url: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  theme_color: z.string().optional(),
  page_template: z.enum(["modern", "classic"]).optional(),
  contact_email: z.string().email("Ugyldig e-post").min(1, "E-post er påkrevd"),
  contact_phone: z.string().optional(),
  website: z.string().url("Ugyldig URL").optional().or(z.literal("")),
  location: z.string().optional(),
  founded_year: z.union([
    z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1),
    z.literal(""),
    z.undefined(),
  ]).optional(),
  is_public: z.boolean(),
});

export type PageFormValues = z.infer<typeof schema>;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae").replace(/ø/g, "oe").replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface Props {
  defaultValues?: Partial<PageFormValues>;
  onSubmit: (values: PageFormValues) => Promise<void>;
  isPending: boolean;
  submitLabel?: string;
  showSlug?: boolean;
  onTogglePublic?: (value: boolean) => void;
}

export function PageForm({ defaultValues, onSubmit, isPending, submitLabel = "Lagre", showSlug = true, onTogglePublic }: Props) {
  const slugManuallyEdited = useRef(!!defaultValues?.slug);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { is_public: false, ...defaultValues },
  });

  const title = watch("title");

  useEffect(() => {
    if (!slugManuallyEdited.current && title && showSlug) {
      setValue("slug", toSlug(title), { shouldValidate: false });
    }
  }, [title, setValue, showSlug]);

  const slugProps = register("slug", {
    onChange: () => {
      slugManuallyEdited.current = true;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Type *</Label>
          <Select
            value={watch("page_type")}
            onValueChange={(v) => setValue("page_type", v as PageFormValues["page_type"])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg type" />
            </SelectTrigger>
            <SelectContent>
              {pageTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.page_type && <p className="text-sm text-destructive">{errors.page_type.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="title">Navn *</Label>
          <Input id="title" {...register("title")} placeholder="Simca Klubben Norge" />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
      </div>

      {showSlug && (
        <div className="space-y-1">
          <Label htmlFor="slug">Adresse *</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground whitespace-nowrap">bilgarasje.no/s/</span>
            <Input id="slug" {...slugProps} placeholder="simca-klubben" />
          </div>
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="tagline">Slagord</Label>
        <Input id="tagline" {...register("tagline")} placeholder="For alle som elsker Simca" />
      </div>

      <div className="space-y-1">
        <Label htmlFor="about">Om oss</Label>
        <Textarea id="about" {...register("about")} placeholder="Fortell om siden" rows={4} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="contact_email">E-post for kontakt *</Label>
          <Input id="contact_email" type="email" {...register("contact_email")} placeholder="kontakt@simcanorge.no" />
          <p className="text-xs text-muted-foreground">Vises i kontaktskjemaet på siden</p>
          {errors.contact_email && <p className="text-sm text-destructive">{errors.contact_email.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact_phone">Telefon</Label>
          <Input id="contact_phone" {...register("contact_phone")} placeholder="+47 123 45 678" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="website">Nettside</Label>
          <Input id="website" {...register("website")} placeholder="https://simcanorge.no" />
          {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="location">Sted</Label>
          <Input id="location" {...register("location")} placeholder="Oslo, Norge" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="founded_year">Grunnlagt år</Label>
          <Input id="founded_year" type="number" {...register("founded_year")} placeholder="1985" />
        </div>

        <div className="space-y-1">
          <Label htmlFor="theme_color">Temafarge (hex)</Label>
          <Input id="theme_color" {...register("theme_color")} placeholder="#1e3a5f" />
        </div>
      </div>

      {watch("page_type") === "club" && (
        <div className="space-y-1">
          <Label>Klubb-layout</Label>
          <Select
            value={watch("page_template") || "modern"}
            onValueChange={(v) => setValue("page_template", v as "modern" | "classic")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Velg layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern (standard, mørk)</SelectItem>
              <SelectItem value="classic">Classic (retro, editorial)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Bestemmer utseende og følelse på den offentlige klubbsiden
          </p>
        </div>
      )}

      {/* Logo/cover URL fields removed — use PageImageUpload in EditPagePage instead */}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Offentlig side</p>
          <p className="text-xs text-muted-foreground">Siden er synlig for alle besøkende</p>
        </div>
        <Switch
          checked={watch("is_public")}
          onCheckedChange={(v) => {
            setValue("is_public", v);
            onTogglePublic?.(v);
          }}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Lagrer…" : submitLabel}
      </Button>
    </form>
  );
}
