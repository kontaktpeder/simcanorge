import { Link } from "react-router-dom";
import { ChevronRight, MessageCircleQuestion } from "lucide-react";
import { useRecentQuestions } from "@/hooks/useQuestions";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const inter = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" } as const;

export function RecentQuestionsBlock({ limit = 5, light = false }: { limit?: number; light?: boolean }) {
  const { data, isLoading } = useRecentQuestions(limit);
  if (isLoading) return null;
  if (!data || data.length === 0) return null;

  if (light) {
    return (
      <div
        className="rounded-2xl border bg-white p-4"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-sm font-extrabold uppercase tracking-[0.1em] flex items-center gap-2"
            style={{ ...inter, color: "#2b2b2b" }}
          >
            <span
              className="inline-flex w-7 h-7 items-center justify-center rounded-lg"
              style={{ background: "#fff4d1" }}
            >
              <MessageCircleQuestion className="w-4 h-4" style={{ color: "#2b2b2b" }} />
            </span>
            Nylige spørsmål
          </h2>
          <Link
            to="/sporsmal/ny"
            className="text-[11px] uppercase tracking-[0.16em] font-bold transition-colors"
            style={{ ...inter, color: "#ff8a00" }}
          >
            Still spørsmål
          </Link>
        </div>
        <ul className="divide-y divide-black/[0.06]">
          {data.map((q) => (
            <li key={q.id}>
              <Link
                to={`/sporsmal/${q.slug}`}
                className="flex items-center justify-between py-2 group"
              >
                <span
                  className="text-[14px] text-neutral-800 group-hover:text-[#2b2b2b] truncate pr-3"
                  style={inter}
                >
                  {q.title}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }

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
