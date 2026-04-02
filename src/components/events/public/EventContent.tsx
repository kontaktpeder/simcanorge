interface EventContentProps {
  description?: string | null;
  program?: string | null;
  practicalInfo?: string | null;
}

export function EventContent({ description, program, practicalInfo }: EventContentProps) {
  const hasContent = description || program || practicalInfo;
  if (!hasContent) return null;

  return (
    <div className="space-y-10">
      {description && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">
            Om arrangementet
          </h2>
          <div className="text-[15px] text-white/50 leading-[1.9] whitespace-pre-wrap">
            {description}
          </div>
        </section>
      )}

      {program && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">
            Program
          </h2>
          <div className="text-[15px] text-white/50 leading-[2] whitespace-pre-wrap font-mono">
            {program}
          </div>
        </section>
      )}

      {practicalInfo && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">
            Praktisk info
          </h2>
          <div className="text-[15px] text-white/50 leading-[1.9] whitespace-pre-wrap">
            {practicalInfo}
          </div>
        </section>
      )}
    </div>
  );
}
