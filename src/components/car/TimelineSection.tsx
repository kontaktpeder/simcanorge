import { CarTimeline } from "./timeline/CarTimeline";

interface TimelineSectionProps {
  carId: string;
  createdAt?: string;
  publishedAt?: string | null;
  mode?: "default" | "spotting";
  heroCaptionEventId?: string | null;
}

export function TimelineSection({ carId, heroCaptionEventId = null }: TimelineSectionProps) {
  return <CarTimeline carId={carId} heroCaptionEventId={heroCaptionEventId} />;
}
