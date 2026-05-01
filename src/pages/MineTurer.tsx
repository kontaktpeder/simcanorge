import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Car, Footprints, Users, Clock, MapPin, Image as ImageIcon, ChevronDown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type ActivityType = "drive" | "walk_spotting" | "meetup";

interface SessionRow {
  id: string;
  type: ActivityType;
  started_at: string;
  ended_at: string | null;
  summary_note: string | null;
  visibility: string;
  moments: number;
}

const META: Record<ActivityType, { label: string; Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; tone: string }> = {
  drive: { label: "Kjøretur", Icon: Car, tone: "#34eab8" },
  walk_spotting: { label: "Spotting", Icon: Footprints, tone: "#7dd3fc" },
  meetup: { label: "Treff", Icon: Users, tone: "#fbbf24" },
};

function formatDuration(start: string, end: string | null) {
  if (!end) return "Pågår";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}t ${mm.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("no-NO", { day: "numeric", month: "short", year: "numeric" });
}

function groupByMonth(sessions: SessionRow[]) {
  const groups = new Map<string, SessionRow[]>();
  for (const s of sessions) {
    const d = new Date(s.started_at);
    const key = d.toLocaleDateString("no-NO", { month: "long", year: "numeric" });
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }
  return Array.from(groups.entries());
}

export default function MineTurer() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from("activity_sessions")
        .select("id, type, started_at, ended_at, summary_note, visibility")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(200);

      const ids = (rows ?? []).map((r) => r.id);
      let counts = new Map<string, number>();
      if (ids.length > 0) {
        const { data: events } = await supabase
          .from("car_events")
          .select("activity_session_id")
          .in("activity_session_id", ids);
        for (const ev of events ?? []) {
          const sid = (ev as { activity_session_id: string | null }).activity_session_id;
          if (!sid) continue;
          counts.set(sid, (counts.get(sid) ?? 0) + 1);
        }
      }

      if (cancelled) return;
      setSessions(
        (rows ?? []).map((r) => ({
          ...(r as Omit<SessionRow, "moments">),
          moments: counts.get(r.id) ?? 0,
        }))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totals = useMemo(() => {
    const list = sessions ?? [];
    const completed = list.filter((s) => s.ended_at);
    const minutes = completed.reduce((acc, s) => {
      return acc + Math.max(0, Math.floor((new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime()) / 60000));
    }, 0);
    const moments = list.reduce((acc, s) => acc + s.moments, 0);
    return { count: list.length, minutes, moments };
  }, [sessions]);

  const grouped = useMemo(() => groupByMonth(sessions ?? []), [sessions]);

  return (
    <div className="min-h-screen bg-[#070b10] pb-32">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#070b10]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40" style={oswald}>
            Aktivitet
          </div>
          <h1 className="text-2xl text-white font-bold mt-1" style={chakra}>
            Mine turer
          </h1>
          <p className="text-[13px] text-white/50 mt-1" style={oswald}>
            Alt du har kjørt, spottet og opplevd. Kun synlig for deg.
          </p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-5">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Turer" value={String(totals.count)} />
          <Stat label="Minutter" value={String(totals.minutes)} />
          <Stat label="Øyeblikk" value={String(totals.moments)} />
        </div>

        {/* Privacy notice */}
        <div
          className="rounded-lg border border-white/[0.06] p-3 flex items-center gap-3"
          style={{ background: "hsl(215 25% 8%)" }}
        >
          <Lock className="w-3.5 h-3.5 text-[#34eab8]" />
          <div className="text-[11px] text-white/55" style={oswald}>
            Alt lagres privat. Deling kommer snart.
          </div>
        </div>

        {/* List */}
        {sessions === null ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full bg-white/[0.04]" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {grouped.map(([month, list]) => (
              <section key={month}>
                <div
                  className="text-[10px] uppercase tracking-[0.2em] text-white/35 mb-2 px-1"
                  style={oswald}
                >
                  {month}
                </div>
                <div className="space-y-2">
                  {list.map((s) => (
                    <SessionCard key={s.id} s={s} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-lg p-3 border border-white/[0.06]"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/35" style={oswald}>
        {label}
      </div>
      <div className="text-[20px] font-bold text-white mt-0.5" style={chakra}>
        {value}
      </div>
    </div>
  );
}

function SessionCard({ s }: { s: SessionRow }) {
  const meta = META[s.type] ?? META.drive;
  const Icon = meta.Icon;
  const ongoing = !s.ended_at;
  return (
    <div
      className="rounded-xl border border-white/[0.06] p-4 transition-colors hover:border-white/[0.12]"
      style={{ background: "hsl(215 25% 9%)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${meta.tone}1a`, border: `1px solid ${meta.tone}33` }}
        >
          <Icon className="w-5 h-5" style={{ color: meta.tone }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14px] text-white font-bold" style={chakra}>
              {meta.label}
            </div>
            {ongoing && (
              <span
                className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "#34eab826", color: "#34eab8", border: "1px solid #34eab84d" }}
              >
                Pågår
              </span>
            )}
          </div>
          <div className="text-[11px] text-white/45 mt-0.5" style={oswald}>
            {formatDate(s.started_at)}
          </div>
          {s.summary_note && (
            <div className="text-[12px] text-white/70 mt-2 line-clamp-2" style={oswald}>
              {s.summary_note}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-white/50" style={oswald}>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(s.started_at, s.ended_at)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              {s.moments} øyeblikk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl border border-dashed border-white/10 p-8 text-center"
      style={{ background: "hsl(215 25% 8%)" }}
    >
      <div className="text-3xl mb-2">🛣️</div>
      <div className="text-white font-bold text-[15px]" style={chakra}>
        Ingen turer ennå
      </div>
      <p className="text-[12px] text-white/50 mt-1.5 max-w-xs mx-auto" style={oswald}>
        Trykk på den grønne <span className="text-[#34eab8] font-bold">Start</span>-knappen nederst
        for å logge din første tur eller spotting-runde.
      </p>
    </div>
  );
}
