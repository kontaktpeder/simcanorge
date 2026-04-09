import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  /** When true, header stays fixed and content+footer scroll in a container */
  contained?: boolean;
  /** When true, Layout does not render its own Footer (useful when Footer is placed inside a custom scroll container) */
  hideFooter?: boolean;
  /** When true, main does not use flex-1 so short pages don't get a huge blank area before the footer */
  shortPage?: boolean;
}

export function Layout({ children, contained = false, hideFooter = false, shortPage = false }: LayoutProps) {
  if (contained) {
    return (
    <div className="h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-14 md:pt-16">
        <main className="min-h-full">
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
      <main className={`${shortPage ? '' : 'flex-1'} overflow-x-hidden pt-14 md:pt-16`}>
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
