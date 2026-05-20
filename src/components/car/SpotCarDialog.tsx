import { useState, cloneElement, isValidElement, type ReactElement, type MouseEvent } from "react";
import { Eye } from "lucide-react";
import { useFeatures } from "@/hooks/useFeatures";
import { ObservationComposeSheet } from "@/components/capture/ObservationComposeSheet";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import type { SpotCarResult } from "@/hooks/useSpotCar";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export interface SpotCarDialogProps {
  trigger?: React.ReactNode;
  onSpotted?: (result: SpotCarResult) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialImageFile?: File | null;
}

/**
 * Bakoverkompatibel wrapper. All compose/success-UX ligg no i
 * ObservationComposeSheet (Instagram-style capture-first). Støttar både:
 *  - controlled: <SpotCarDialog open onOpenChange initialImageFile />
 *  - trigger-only: <SpotCarDialog trigger={<Button/>} />
 */
export function SpotCarDialog({
  trigger,
  onSpotted,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  initialImageFile,
}: SpotCarDialogProps) {
  const features = useFeatures();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? !!openProp : internalOpen;

  if (!features.spotting) return null;

  const setOpen = (next: boolean) => {
    if (next && !user) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    if (!controlled) setInternalOpen(next);
    onOpenChangeProp?.(next);
  };

  const triggerEl = trigger && isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>, {
        onClick: (e: MouseEvent) => {
          (trigger as ReactElement<{ onClick?: (e: MouseEvent) => void }>).props.onClick?.(e);
          if (!e.defaultPrevented) setOpen(true);
        },
      })
    : trigger;

  return (
    <>
      {triggerEl}
      <ObservationComposeSheet
        open={open}
        onOpenChange={setOpen}
        initialImageFile={initialImageFile}
        onPublished={onSpotted}
      />
    </>
  );
}
