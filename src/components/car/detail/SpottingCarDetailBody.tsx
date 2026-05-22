import { Link } from "react-router-dom";
import { TimelineSection } from "@/components/car/TimelineSection";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";

const PAPER_BG = "#f3f1ea";

type Props = {
  carId: string;
  createdAt?: string;
  publishedAt?: string | null;
  galleryBlock?: React.ReactNode;
  showIdentifyHelpLink?: boolean;
  onKnowHistory?: () => void;
  showKnowHistoryCta?: boolean;
};

export function SpottingCarDetailBody({
  carId,
  createdAt,
  publishedAt,
  galleryBlock,
  showIdentifyHelpLink,
  onKnowHistory,
  showKnowHistoryCta,
}: Props) {
  return (
    <div style={{ backgroundColor: PAPER_BG }} className="text-neutral-900">
      {galleryBlock}

      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatedSection>
            <TimelineSection
              carId={carId}
              createdAt={createdAt}
              publishedAt={publishedAt}
              mode="spotting"
            />
            {showKnowHistoryCta && onKnowHistory && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={onKnowHistory}
                  className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-900 transition-colors border-b border-neutral-300 hover:border-neutral-700 pb-0.5"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Kjenner du historien?
                </button>
              </div>
            )}
          </AnimatedSection>
        </div>
      </section>

      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <OwnerCard carId={carId} heading="Eies av" />
        </div>
      </section>

      {showIdentifyHelpLink && (
        <div className="container mx-auto px-4 pb-10 text-center">
          <Link
            to="/ukjente-biler"
            className="text-xs uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-900 transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </div>
  );
}
