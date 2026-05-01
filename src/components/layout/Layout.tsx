import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";
import { FocusModeOverlay } from "./FocusModeOverlay";
import { useAuth } from "@/hooks/useAuth";
import { useActivitySession } from "@/hooks/useActivitySession";
import carSilhouette from "@/assets/car-silhouette.png";

interface LayoutProps {
  children: ReactNode;
  /** When true, header stays fixed and content+footer scroll in a container */
  contained?: boolean;
  /** When true, Layout does not render its own Footer (useful when Footer is placed inside a custom scroll container) */
  hideFooter?: boolean;
  /** When true, main does not use flex-1 so short pages don't get a huge blank area before the footer */
  shortPage?: boolean;
  /** When true (contained mode only), main becomes a flex column and children handle their own scrolling */
  fillHeight?: boolean;
}

function SubpageSilhouette() {
  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none hidden sm:flex justify-center overflow-hidden z-0" style={{ opacity: 0.02 }}>
      <img
        src={carSilhouette}
        alt=""
        className="w-[60%] max-w-[800px] translate-y-[30%]"
        style={{ transform: 'scaleX(-1)', filter: 'invert(1) brightness(2)' }}
      />
    </div>
  );
}

export function Layout({ children, contained = false, hideFooter = false, shortPage = false, fillHeight = false }: LayoutProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { activeSession } = useActivitySession();
  const isIndex = pathname === "/";

  // Reserve space at the bottom on mobile when the BottomNav is shown
  // (i.e. user is signed in and not in focus mode).
  const showBottomNav = !!user && !activeSession;
  const bottomPadClass = showBottomNav ? "pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0" : "";

  if (contained) {
    if (fillHeight) {
      return (
        <div className="h-screen min-h-[100dvh] flex flex-col overflow-hidden">
          <Header />
          {!isIndex && <SubpageSilhouette />}
          <main className={`flex-1 min-h-0 flex flex-col relative z-10 pt-14 md:pt-16 ${bottomPadClass}`}>
            {children}
          </main>
          <BottomNav />
          <FocusModePill />
        </div>
      );
    }
    return (
    <div className="h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      <Header />
      {!isIndex && <SubpageSilhouette />}
      <div className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-16 ${bottomPadClass}`}>
        <main className="min-h-full relative z-10">
          {children}
        </main>
        {!hideFooter && <Footer />}
      </div>
      <BottomNav />
      <FocusModePill />
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      {!isIndex && <SubpageSilhouette />}
      <main className={`${shortPage ? '' : 'flex-1'} overflow-x-hidden pt-14 md:pt-16 relative z-10 ${bottomPadClass}`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      <BottomNav />
      <FocusModePill />
    </div>
  );
}
