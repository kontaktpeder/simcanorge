import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMyPages } from "@/hooks/useMyPages";

function toSlug(v: string) {
  return v
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const schema = z
  .object({
    event_type: z.enum([
      "meet", "show", "market", "drive",
      "club_night", "exhibition", "open_day", "other",
    ]),
    title: z.string().min(2, "Tittel er påkrevd"),
    slug: z
      .string()
      .min(2)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Kun små bokstaver og bindestrek"),
    location: z.string().min(1, "Sted er påkrevd"),
    starts_at: z.string().min(1, "Startdato er påkrevd"),
    ends_at: z.string().optional().or(z.literal("")),
    short_description: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    program: z.string().optional().or(z.literal("")),
    practical_info: z.string().optional().or(z.literal("")),
    registration_url: z.string().url("Ugyldig URL").optional().or(z.literal("")),
    max_attendees: z.union([
      z.coerce.number().int().positive(),
      z.literal(""),
      z.undefined(),
    ]).optional(),
    status: z.enum(["draft", "published", "cancelled", "archived"]),
    owner_page_id: z.string().nullable().optional(),
  })
  .refine(
    (d) => {
      if (d.ends_at && d.starts_at && d.ends_at < d.starts_at) return false;
      return true;
    },
    { message: "Sluttdato kan ikke være før startdato", path: ["ends_at"] }
  );

export type EventFormValues = z.infer<typeof schema>;

const eventTypeOptions = [
  { value: "meet", label: "Biltreff" },
  { value: "show", label: "Show" },
  { value: "market", label: "Delemarked" },
  { value: "drive", label: "Kjøretur" },
  { value: "club_night", label: "Klubbkveld" },
  { value: "exhibition", label: "Utstilling" },
  { value: "open_day", label: "Åpen dag" },
  { value: "other", label: "Annet" },
];

interface Props {
  defaultValues?: Partial<EventFormValues>;
  onSubmit: (values: EventFormValues) => Promise<void>;
  isPending: boolean;
  submitLabel?: string;
  mode?: "create" | "edit";
}

export function EventForm({
  defaultValues,
  onSubmit,
  isPending,
  submitLabel = "Lagre",
  mode = "create",
}: Props) {
  const slugManuallyEdited = useRef(false);
  const { data: myPages } = useMyPages();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { status: "draft", event_type: "meet", owner_page_id: null, ...defaultValues },
  });

  const title = watch("title");

  useEffect(() => {
    if (!slugManuallyEdited.current && title && mode === "create") {
      setValue("slug", toSlug(title), { shouldValidate: false });
    }
  }, [title, setValue, mode]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Type & title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Type *</Label>
          <Select
            defaultValue={defaultValues?.event_type ?? "meet"}
            onValueChange={(v) => setValue("event_type", v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypeOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.event_type && (
            <p className="text-sm text-destructive">{errors.event_type.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="title">Tittel *</Label>
          <Input id="title" {...register("title")} placeholder="Sommertreff 2026" />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>
      </div>

      {/* Slug */}
      {mode === "create" && (
        <div className="space-y-1">
          <Label htmlFor="slug">Adresse *</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              /e/
            </span>
            <Input
              id="slug"
              {...register("slug", {
                onChange: () => {
                  slugManuallyEdited.current = true;
                },
              })}
              placeholder="sommertreff-2026"
            />
          </div>
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      )}

      {/* Location */}
      <div className="space-y-1">
        <Label htmlFor="location">Sted *</Label>
        <Input id="location" {...register("location")} placeholder="Lillestrøm" />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="starts_at">Startdato *</Label>
          <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
          {errors.starts_at && (
            <p className="text-sm text-destructive">{errors.starts_at.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="ends_at">Sluttdato</Label>
          <Input id="ends_at" type="datetime-local" {...register("ends_at")} />
          {errors.ends_at && (
            <p className="text-sm text-destructive">{errors.ends_at.message}</p>
          )}
        </div>
      </div>

      {/* Organizer page — only shown if user has pages */}
      {myPages && myPages.length > 0 && (
        <div className="space-y-1">
          <Label>Arrangert av</Label>
          <Select
            defaultValue={defaultValues?.owner_page_id ?? "none"}
            onValueChange={(v) =>
              setValue("owner_page_id", v === "none" ? null : v)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Personlig (deg selv)</SelectItem>
              {myPages.map((page) => (
                <SelectItem key={page.id} value={page.id}>
                  {page.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Velg om arrangementet skjer på vegne av en side du administrerer
          </p>
        </div>
      )}

      {/* Extended fields in edit mode */}
      {mode === "edit" && (
        <>
          <div className="space-y-1">
            <Label htmlFor="short_description">Kort beskrivelse</Label>
            <Textarea
              id="short_description"
              {...register("short_description")}
              rows={2}
              placeholder="Kort oppsummering som vises i oversikter…"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Om eventet</Label>
            <Textarea
              id="description"
              {...register("description")}
              rows={5}
              placeholder="Fortell mer om arrangementet…"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="program">Program</Label>
            <Textarea
              id="program"
              {...register("program")}
              rows={4}
              placeholder={"10:00 – Åpning\n11:00 – Premieutdeling\n13:00 – Avslutning"}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="practical_info">Praktisk info</Label>
            <Textarea
              id="practical_info"
              {...register("practical_info")}
              rows={3}
              placeholder="Parkering, servering, hva man bør ta med…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="registration_url">Påmeldingslenke</Label>
              <Input
                id="registration_url"
                {...register("registration_url")}
                placeholder="https://…"
              />
              {errors.registration_url && (
                <p className="text-sm text-destructive">
                  {errors.registration_url.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="max_attendees">Maks deltakere</Label>
              <Input
                id="max_attendees"
                type="number"
                {...register("max_attendees")}
                placeholder="100"
              />
            </div>
          </div>
        </>
      )}

      {/* Status */}
      <div className="space-y-1">
        <Label>Status</Label>
        <Select
          defaultValue={defaultValues?.status ?? "draft"}
          onValueChange={(v) => setValue("status", v as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Utkast</SelectItem>
            <SelectItem value="published">Publisert</SelectItem>
            <SelectItem value="cancelled">Avlyst</SelectItem>
            <SelectItem value="archived">Arkivert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Lagrer…" : submitLabel}
      </Button>
    </form>
  );
}
