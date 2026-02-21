import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
  /** When true, header stays fixed and content+footer scroll in a container */
  contained?: boolean;
}

export function Layout({ children, contained = false }: LayoutProps) {
  if (contained) {
    return (
    <div className="h-screen min-h-[100dvh] flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <main className="min-h-full">
          {children}
        </main>
        <Footer />
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
