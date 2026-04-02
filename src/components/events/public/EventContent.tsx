interface EventContentProps {
  description?: string | null;
  program?: string | null;
  practicalInfo?: string | null;
}

export function EventContent({ description, program, practicalInfo }: EventContentProps) {
  const hasContent = description || program || practicalInfo;
  if (!hasContent) return null;

  return (
    <div className="space-y-12">
      {description && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 tracking-tight">
            Om arrangementet
          </h2>
          <div className="text-[15px] text-white/60 leading-[1.8] whitespace-pre-wrap">
            {description}
          </div>
        </section>
      )}

      {program && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 tracking-tight">
            Program
          </h2>
          <div className="text-[15px] text-white/60 leading-[1.8] whitespace-pre-wrap font-mono">
            {program}
          </div>
        </section>
      )}

      {practicalInfo && (
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 tracking-tight">
            Praktisk informasjon
          </h2>
          <div className="text-[15px] text-white/60 leading-[1.8] whitespace-pre-wrap">
            {practicalInfo}
          </div>
        </section>
      )}
    </div>
  );
}
