import { Link } from "react-router-dom";
import { CommentSection } from "@/components/comments/CommentSection";
import { TimelineSection } from "@/components/car/TimelineSection";
import { OwnerCard } from "@/components/car/OwnerCard";
import { CarQuestionsSection } from "@/components/questions/CarQuestionsSection";
import { AnimatedSection } from "@/components/layout/AnimatedSection";

type Props = {
  carId: string;
  createdAt?: string;
  publishedAt?: string | null;
  galleryBlock?: React.ReactNode;
  shareBlock?: React.ReactNode;
  showIdentifyHelpLink?: boolean;
};

export function SpottingCarDetailBody({
  carId,
  createdAt,
  publishedAt,
  galleryBlock,
  shareBlock,
  showIdentifyHelpLink,
}: Props) {
  return (
    <>
      <section className="py-6 md:py-10">
        <div className="container mx-auto px-4 max-w-3xl">
          <CommentSection carId={carId} variant="light" />
        </div>
      </section>

      {galleryBlock}

      <section className="py-8 md:py-12 border-t border-white/[0.06]">
        <div className="container mx-auto px-4 max-w-3xl">
          <AnimatedSection>
            <h2
              className="text-[12px] uppercase tracking-[0.2em] text-white/55 mb-4"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Observasjoner
            </h2>
            <TimelineSection carId={carId} createdAt={createdAt} publishedAt={publishedAt} />
          </AnimatedSection>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <OwnerCard carId={carId} heading="Eies av" />
        </div>
      </section>

      <CarQuestionsSection carId={carId} />

      {shareBlock}

      {showIdentifyHelpLink && (
        <div className="container mx-auto px-4 pb-10 text-center">
          <Link
            to="/ukjente-biler"
            className="text-xs uppercase tracking-[0.18em] text-white/45 hover:text-white/85 transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Hjelp fellesskapet å identifisere bilen
          </Link>
        </div>
      )}
    </>
  );
}
