import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type PublishComposerVisibility = "public" | "private";

export interface OpenPublishComposerProps {
  /** Pre-utfylt bilde (kamera/galleri). */
  initialImageFile?: File | null;
  /** Pre-utfylt tekst (caption). */
  initialCaption?: string;
  /** Lås composer til en bestemt bil ("På denne bilen"). */
  prefillCarId?: string | null;
  /** Vises som tittel på bil-chipen når carId er satt. */
  prefillCarTitle?: string | null;
  /** Aktiv tur — sendes til car_event som activity_session_id. */
  prefillSessionId?: string | null;
  /** Default synlighet. */
  defaultVisibility?: PublishComposerVisibility;
  /** Analytics-kontekst. */
  source?: string;
}

interface PublishComposerContextValue {
  isOpen: boolean;
  props: OpenPublishComposerProps;
  openPublishComposer: (props?: OpenPublishComposerProps) => void;
  closePublishComposer: () => void;
}

const PublishComposerContext = createContext<PublishComposerContextValue | null>(
  null,
);

export function PublishComposerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [props, setProps] = useState<OpenPublishComposerProps>({});

  const openPublishComposer = useCallback(
    (next: OpenPublishComposerProps = {}) => {
      setProps(next);
      setIsOpen(true);
    },
    [],
  );

  const closePublishComposer = useCallback(() => {
    setIsOpen(false);
    // La props ligge en frame slik at unmount-animasjon ikke flimrer.
    window.setTimeout(() => setProps({}), 250);
  }, []);

  const value = useMemo<PublishComposerContextValue>(
    () => ({ isOpen, props, openPublishComposer, closePublishComposer }),
    [isOpen, props, openPublishComposer, closePublishComposer],
  );

  return (
    <PublishComposerContext.Provider value={value}>
      {children}
    </PublishComposerContext.Provider>
  );
}

export function usePublishComposer(): PublishComposerContextValue {
  const ctx = useContext(PublishComposerContext);
  if (!ctx) {
    throw new Error(
      "usePublishComposer må brukes innenfor <PublishComposerProvider>",
    );
  }
  return ctx;
}
