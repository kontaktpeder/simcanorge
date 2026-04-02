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
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Om arrangementet
          </h2>
          <div className="text-base sm:text-lg text-muted-foreground leading-[1.85] whitespace-pre-wrap max-w-prose">
            {description}
          </div>
        </section>
      )}

      {program && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Program
          </h2>
          <div className="text-base sm:text-lg text-muted-foreground leading-[2] whitespace-pre-wrap max-w-prose">
            {program}
          </div>
        </section>
      )}

      {practicalInfo && (
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Praktisk informasjon
          </h2>
          <div className="text-base sm:text-lg text-muted-foreground leading-[1.85] whitespace-pre-wrap max-w-prose">
            {practicalInfo}
          </div>
        </section>
      )}
    </div>
  );
}
