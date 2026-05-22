import { Link } from "react-router-dom";
import { TimelineSection } from "@/components/car/TimelineSection";
import { OwnerCard } from "@/components/car/OwnerCard";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { SpottingCommentsBlock } from "./SpottingCommentsBlock";

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
    <>
      <section className="py-6 md:py-8 bg-white">
        <div className="container mx-auto px-4 max-w-3xl">
          <SpottingCommentsBlock carId={carId} />
        </div>
      </section>

      {galleryBlock}

      <section className="py-8 md:py-10 bg-white border-t border-neutral-200/70">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatedSection>
            <div className="flex items-baseline justify-between mb-4 gap-3">
              <h2
                className="text-[12px] uppercase tracking-[0.2em] text-neutral-600"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Tidslinje
              </h2>
              {showKnowHistoryCta && onKnowHistory && (
                <button
                  type="button"
                  onClick={onKnowHistory}
                  className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-900 transition-colors border-b border-neutral-300 hover:border-neutral-700 pb-0.5"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Kjenner du historien?
                </button>
              )}
            </div>
            <TimelineSection
              carId={carId}
              createdAt={createdAt}
              publishedAt={publishedAt}
              mode="spotting"
            />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-8 md:py-10 bg-white">
        <div className="container mx-auto px-4 max-w-2xl">
          <OwnerCard carId={carId} heading="Eies av" />
        </div>
      </section>

      {showIdentifyHelpLink && (
        <div className="container mx-auto px-4 pb-10 text-center bg-white">
          <Link
            to="/ukjente-biler"
            className="text-xs uppercase tracking-[0.18em] text-neutral-500 hover:text-neutral-900 transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </>
  );
}
