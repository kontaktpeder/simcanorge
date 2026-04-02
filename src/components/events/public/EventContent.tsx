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
        <div>
          <h2 className="text-lg font-semibold text-[#E6EDF3] mb-3">Om arrangementet</h2>
          <div className="text-sm text-[#8B98A5] leading-relaxed whitespace-pre-wrap">
            {description}
          </div>
        </div>
      )}

      {program && (
        <div>
          <h2 className="text-lg font-semibold text-[#E6EDF3] mb-3">Program</h2>
          <div className="text-sm text-[#8B98A5] leading-relaxed whitespace-pre-wrap">
            {program}
          </div>
        </div>
      )}

      {practicalInfo && (
        <div>
          <h2 className="text-lg font-semibold text-[#E6EDF3] mb-3">Praktisk informasjon</h2>
          <div className="text-sm text-[#8B98A5] leading-relaxed whitespace-pre-wrap">
            {practicalInfo}
          </div>
        </div>
      )}
    </div>
  );
}
