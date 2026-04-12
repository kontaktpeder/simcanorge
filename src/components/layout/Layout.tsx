import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import carSilhouette from "@/assets/car-silhouette.png";

interface LayoutProps {
  children: ReactNode;
  /** When true, header stays fixed and content+footer scroll in a container */
  contained?: boolean;
  /** When true, Layout does not render its own Footer (useful when Footer is placed inside a custom scroll container) */
  hideFooter?: boolean;
  /** When true, main does not use flex-1 so short pages don't get a huge blank area before the footer */
  shortPage?: boolean;
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

export function Layout({ children, contained = false, hideFooter = false, shortPage = false }: LayoutProps) {
  const { pathname } = useLocation();
  const isIndex = pathname === "/";

  if (contained) {
    return (
    <div className="h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      <Header />
      {!isIndex && <SubpageSilhouette />}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-16">
        <main className="min-h-full relative z-10">
          {children}
        </main>
        {!hideFooter && <Footer />}
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      {!isIndex && <SubpageSilhouette />}
      <main className={`${shortPage ? '' : 'flex-1'} overflow-x-hidden pt-14 md:pt-16 relative z-10`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
