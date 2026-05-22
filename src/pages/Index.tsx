import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";
import { ExploreMomentCta } from "@/components/explore/ExploreMomentCta";
import { ExploreInlineComposer } from "@/components/explore/ExploreInlineComposer";
import { ExploreSectionNav } from "@/components/explore/ExploreSectionNav";
import { RecentQuestionsBlock } from "@/components/questions/RecentQuestionsBlock";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

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
      <Helmet>
        <title>Utforsk — Bilgarasje.no</title>
        <meta
          name="description"
          content="Utforsk øyeblikk fra norske bileiere — biler, spotting og hverdagshistorier."
        />
      </Helmet>

      <ExploreSectionNav />

      <section
        className="relative pb-20"
        style={{
          background:
            "linear-gradient(180deg, #0c1219 0%, #0a0f15 50%, #070b10 100%)",
        }}
      >
        <div className="max-w-[520px] mx-auto px-3 sm:px-5 pt-4 sm:pt-6">
          {/* Inline composer */}
          <div className="mb-5">
            <ExploreInlineComposer />
          </div>

          {/* Recent questions */}
          <div className="mb-6">
            <RecentQuestionsBlock />
          </div>

          {/* Loading */}
          {feedLoading && (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[360px] bg-white/[0.04] rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Feed */}
          {!feedLoading && posts.length > 0 && (
            <div>
              {posts.map((post, i) => (
                <div key={post.id}>
                  {i > 0 && i % 4 === 0 && (
                    <div className="my-8">
                      <ExploreMomentCta
                        variant="mid"
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
                  <FeedCard post={post} variant="explore" />
                  {i < posts.length - 1 && (
                    <div className="h-px bg-white/[0.08] my-8" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!feedLoading && posts.length === 0 && (
            <div className="py-16 text-center">
              <p
                className="text-[1.1rem] uppercase text-white/35 font-bold tracking-[0.08em]"
                style={oswald}
              >
                Ingen har delt noe ennå.
              </p>
              <p
                className="text-[12px] text-white/40 mt-2 mb-5"
                style={chakra}
              >
                Bli den første 👇
              </p>
              {!user && (
                <Link
                  to="/login?returnUrl=/hjem"
                  className="inline-block text-[12px] uppercase tracking-[0.2em] text-[#2dd4a8] hover:text-[#5aedc4] font-bold transition-colors border-b border-[#2dd4a8]/30 hover:border-[#2dd4a8]/60 pb-0.5"
                  style={oswald}
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
