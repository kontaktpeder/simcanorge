import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SeoHead } from "@/components/seo";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, BookmarkCheck, Car as CarIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useQuestionBySlug } from "@/hooks/useQuestions";
import { useQuestionReplies, useAddQuestionReply } from "@/hooks/useQuestionReplies";
import { useIsQuestionSaved, useToggleQuestionSave } from "@/hooks/useQuestionSave";

export default function SporsmalDetalj() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: q, isLoading } = useQuestionBySlug(slug);
  const { data: replies } = useQuestionReplies(q?.id);
  const { data: isSaved } = useIsQuestionSaved(q?.id);
  const toggleSave = useToggleQuestionSave(q?.id);
  const addReply = useAddQuestionReply(q?.id);
  const [reply, setReply] = useState("");

  if (isLoading) {
    return <Layout><div className="py-20 text-center text-white/50">Laster...</div></Layout>;
  }
  if (!q) {
    return (
      <Layout>
        <div className="py-20 text-center text-white/60">
          Spørsmålet finnes ikke eller er fjernet.
        </div>
      </Layout>
    );
  }

  const author: any = (q as any).author;
  const car: any = (q as any).car;

  async function onSave() {
    if (!user) {
      window.location.href = `/login?returnUrl=/sporsmal/${slug}`;
      return;
    }
    try {
      const next = await toggleSave.mutateAsync(!!isSaved);
      toast.success(next ? "Lagret" : "Lagring fjernet");
    } catch (e: any) {
      toast.error(e?.message ?? "Noe gikk galt");
    }
  }

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      window.location.href = `/login?returnUrl=/sporsmal/${slug}`;
      return;
    }
    if (reply.trim().length < 2) return;
    try {
      await addReply.mutateAsync(reply);
      setReply("");
      toast.success("Svar publisert");
    } catch (e: any) {
      toast.error(e?.message ?? "Kunne ikke svare");
    }
  }

  return (
    <Layout>
      <SeoHead
        title={`${q.title} — Spørsmål — Bilgarasje.no`}
        canonicalPath={`/sporsmal/${slug}`}
      />
      <PageHeader title={q.title} />
      <section className="bg-[#070b10] py-8">
        <div className="max-w-[720px] mx-auto px-5 space-y-6">
          <div className="flex items-center justify-between text-[12px] text-white/50">
            <div>
              {author?.slug ? (
                <Link to={`/profil/${author.slug}`} className="text-white/80 hover:text-white">
                  {author.display_name ?? "Bruker"}
                </Link>
              ) : (
                <span>Bruker</span>
              )}
              <span className="mx-2">·</span>
              {new Date(q.created_at).toLocaleDateString("nb-NO")}
              {car?.slug && (
                <>
                  <span className="mx-2">·</span>
                  <Link to={`/biler/${car.slug}`} className="inline-flex items-center gap-1 text-[#2dd4a8] hover:underline">
                    <CarIcon className="w-3 h-3" /> Se bil
                  </Link>
                </>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="text-white/70 hover:text-white"
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 mr-1" /> : <Bookmark className="w-4 h-4 mr-1" />}
              {isSaved ? "Lagret" : "Lagre"}
            </Button>
          </div>

          <div className="text-white/85 whitespace-pre-wrap leading-relaxed">{q.body}</div>

          <div className="pt-4 border-t border-white/10">
            <h2 className="text-white/80 text-sm uppercase tracking-wider mb-3">
              Svar ({replies?.length ?? 0})
            </h2>
            <div className="space-y-4">
              {(replies ?? []).map((r: any) => (
                <div key={r.id} className="rounded-lg border border-white/10 p-4 bg-white/[0.03]">
                  <div className="text-[12px] text-white/50 mb-1">
                    {r.author?.slug ? (
                      <Link to={`/profil/${r.author.slug}`} className="text-white/80 hover:text-white">
                        {r.author.display_name ?? "Bruker"}
                      </Link>
                    ) : "Bruker"}
                    <span className="mx-2">·</span>
                    {new Date(r.created_at).toLocaleDateString("nb-NO")}
                  </div>
                  <div className="text-white/85 whitespace-pre-wrap">{r.body}</div>
                </div>
              ))}
              {(!replies || replies.length === 0) && (
                <div className="text-white/40 text-sm">Ingen svar ennå.</div>
              )}
            </div>
          </div>

          <form onSubmit={onReply} className="pt-4 border-t border-white/10 space-y-3">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={4}
              placeholder={user ? "Skriv et svar..." : "Logg inn for å svare"}
              maxLength={8000}
              className="bg-white/5 border-white/10 text-white"
              disabled={!user}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={!user || addReply.isPending || reply.trim().length < 2}>
                {addReply.isPending ? "Publiserer..." : "Publiser svar"}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
