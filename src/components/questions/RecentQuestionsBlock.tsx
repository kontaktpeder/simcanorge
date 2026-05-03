import { Link } from "react-router-dom";
import { ChevronRight, MessageCircleQuestion } from "lucide-react";
import { useRecentQuestions } from "@/hooks/useQuestions";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function RecentQuestionsBlock({ limit = 5 }: { limit?: number }) {
  const { data, isLoading } = useRecentQuestions(limit);
  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white/85 text-sm font-bold uppercase tracking-[0.08em]" style={chakra}>
          <MessageCircleQuestion className="w-4 h-4 inline mr-2 -mt-0.5 text-[#2dd4a8]" />
          Nylige spørsmål
        </h2>
        <Link to="/sporsmal/ny" className="text-[11px] uppercase tracking-wider text-[#2dd4a8] hover:text-[#5aedc4]">
          Still spørsmål
        </Link>
      </div>
      <ul className="divide-y divide-white/[0.06]">
        {data.map((q) => (
          <li key={q.id}>
            <Link
              to={`/sporsmal/${q.slug}`}
              className="flex items-center justify-between py-2 group"
            >
              <span className="text-[14px] text-white/85 group-hover:text-white truncate pr-3">
                {q.title}
              </span>
              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
