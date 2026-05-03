import { Link } from "react-router-dom";
import { ChevronRight, MessageCircleQuestion } from "lucide-react";
import { useQuestionsByCarId } from "@/hooks/useQuestions";

export function CarQuestionsSection({ carId }: { carId: string }) {
  const { data } = useQuestionsByCarId(carId);

  return (
    <section className="max-w-[800px] mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/85 text-sm font-bold uppercase tracking-[0.08em]">
          <MessageCircleQuestion className="w-4 h-4 inline mr-2 -mt-0.5 text-[#2dd4a8]" />
          Spørsmål om denne bilen
        </h2>
        <Link
          to={`/sporsmal/ny?car_id=${carId}`}
          className="text-[11px] uppercase tracking-wider text-[#2dd4a8] hover:text-[#5aedc4]"
        >
          Still spørsmål
        </Link>
      </div>
      {(!data || data.length === 0) ? (
        <div className="text-white/40 text-sm">Ingen spørsmål ennå.</div>
      ) : (
        <ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.08] bg-white/[0.03]">
          {data.map((q) => (
            <li key={q.id}>
              <Link
                to={`/sporsmal/${q.slug}`}
                className="flex items-center justify-between px-4 py-3 group"
              >
                <span className="text-[14px] text-white/85 group-hover:text-white truncate pr-3">
                  {q.title}
                </span>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
