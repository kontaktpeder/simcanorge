import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { SeoHead, SEO_COPY } from "@/components/seo";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";
import { ExploreMomentCta } from "@/components/explore/ExploreMomentCta";
import { ExploreInlineComposer } from "@/components/explore/ExploreInlineComposer";
import { ExploreSectionNav } from "@/components/explore/ExploreSectionNav";
import { ExploreArchiveLink } from "@/components/explore/ExploreArchiveLink";
import { RecentQuestionsBlock } from "@/components/questions/RecentQuestionsBlock";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";

// Vegvesen-light palette
const VV_BG = "#f3f3f3";
const VV_ORANGE = "#ff8a00";
const VV_DARK = "#2b2b2b";
const inter = "'Inter', system-ui, -apple-system, sans-serif";

export default function Index() {
  const { user } = useAuth();
  const { data: feedPosts, isLoading: feedLoading } = useFeedPosts();
  const [momentOpen, setMomentOpen] = useState(false);

  const posts = useMemo(() => feedPosts ?? [], [feedPosts]);

  function openMoment() {
    setMomentOpen(true);
  }

  return (
    <Layout>
      <SeoHead {...SEO_COPY.utforsk} />

      <ExploreSectionNav light />

      <section
        className="relative pb-24"
        style={{ background: VV_BG, color: VV_DARK, fontFamily: inter }}
      >
        {/* Thin orange progress stripe under nav */}
        <div className="h-[3px] w-full" style={{ background: VV_ORANGE }} />

        <div className="max-w-[640px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          {/* Section heading */}
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p
                className="text-[11px] uppercase tracking-[0.22em] font-bold"
                style={{ color: VV_ORANGE, fontFamily: inter }}
              >
                Utforsk
              </p>
              <h1
                className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ color: VV_DARK, fontFamily: inter }}
              >
                Feed
              </h1>
            </div>
            <ExploreArchiveLink light />
          </div>

          {/* Inline composer */}
          <div className="mb-5">
            <ExploreInlineComposer light />
          </div>

          {/* Recent questions */}
          <div className="mb-6">
            <RecentQuestionsBlock light />
          </div>

          {/* Loading */}
          {feedLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[360px] bg-white rounded-2xl animate-pulse border"
                  style={{ borderColor: "rgba(0,0,0,0.06)" }}
                />
              ))}
            </div>
          )}

          {/* Feed */}
          {!feedLoading && posts.length > 0 && (
            <div className="space-y-4">
              {posts.map((post, i) => (
                <div key={post.id}>
                  {i > 0 && i % 4 === 0 && (
                    <div className="my-4">
                      <ExploreMomentCta
                        variant="mid"
                        light
                        onClick={() => {
                          if (!user) {
                            window.location.href = "/login?returnUrl=/hjem";
                            return;
                          }
                          openMoment();
                        }}
                      />
                    </div>
                  )}
                  <article
                    className="rounded-2xl border bg-white p-4 sm:p-5 shadow-sm"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <FeedCard post={post} variant="explore" theme="light" />
                  </article>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!feedLoading && posts.length === 0 && (
            <div
              className="py-16 text-center rounded-2xl border-2 border-dashed bg-white/60"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <p
                className="text-[1.05rem] uppercase font-bold tracking-[0.08em]"
                style={{ color: VV_DARK, fontFamily: inter }}
              >
                Ingen har delt noe ennå.
              </p>
              <p
                className="text-[12px] text-neutral-500 mt-2 mb-5"
                style={{ fontFamily: inter }}
              >
                Bli den første 👇
              </p>
              {!user && (
                <Link
                  to="/login?returnUrl=/hjem"
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-[12px] uppercase tracking-[0.18em] font-bold transition"
                  style={{
                    background: VV_DARK,
                    color: "#fcc419",
                    fontFamily: inter,
                  }}
                >
                  Logg inn for å starte →
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <AddMomentDialog
        sessionId={null}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
    </Layout>
  );
}
