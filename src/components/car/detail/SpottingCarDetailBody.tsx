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
};

export function SpottingCarDetailBody({
  carId,
  createdAt,
  publishedAt,
  galleryBlock,
  showIdentifyHelpLink,
}: Props) {
  return (
    <div style={{ backgroundColor: PAPER_BG }} className="text-neutral-900">
      {galleryBlock}

      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatedSection>
            <TimelineSection
              carId={carId}
              createdAt={createdAt}
              publishedAt={publishedAt}
              mode="spotting"
            />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-6 md:py-8">
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
