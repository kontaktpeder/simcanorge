import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft } from 'lucide-react';
import { GarageIcon } from '@/components/ui/GarageIcon';
import garageBackground from '@/assets/garage-background.jpg';

// Preload immediately when module loads
const preloadLink = document.createElement('link');
preloadLink.rel = 'preload';
preloadLink.as = 'image';
preloadLink.href = garageBackground;
document.head.appendChild(preloadLink);

interface GarageLayoutProps {
  title: string;
  subtitle?: string;
  description?: string;
  children: ReactNode;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
}

export function GarageLayout({
  title,
  subtitle,
  description,
  children,
  showBackButton = false,
  backTo = '/dashboard',
  backLabel = 'Tilbake',
}: GarageLayoutProps) {
  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden">
      <Header />
      
      {/* Scrollable content + footer */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {/* Bakgrunnsbilde */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 will-change-transform"
          style={{ 
            backgroundImage: `url(${garageBackground})`,
            backgroundAttachment: 'scroll',
          }}
        />
        
        {/* Mørk gritty overlay */}
        <div className="fixed inset-0 bg-background/70 -z-10 will-change-transform" />
        
        {/* Innhold */}
        <main className="container px-4 sm:px-6 py-8 sm:py-12 animate-fade-in pb-safe min-h-[calc(100dvh-140px)]">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground mb-6 transition-colors font-display text-base uppercase tracking-wider min-h-[48px] active:scale-95 touch-manipulation drop-shadow-md"
              >
                <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                <span>{backLabel}</span>
              </Link>
            )}
            
            {/* Editorial header */}
            <div className="space-y-4" style={{ textShadow: '0 1px 4px hsla(0,0%,0%,0.5), 0 0 20px hsla(0,0%,0%,0.3)' }}>
              {/* Red accent rule */}
              <div className="w-16 h-1.5 shadow-md" style={{ background: 'hsl(2, 85%, 40%)' }} />
              
              <div className="space-y-2">
                {title !== (subtitle || title) && (
                  <p className="font-display text-sm sm:text-base uppercase tracking-[0.3em] text-foreground/80">
                    {title}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground uppercase tracking-wider leading-[0.9] drop-shadow-lg">
                    {subtitle || title}
                  </h1>
                  <GarageIcon size={56} animate className="drop-shadow-lg flex-shrink-0" />
                </div>
              </div>

              {description && (
                <p className="font-serif italic text-lg sm:text-xl text-foreground/75 max-w-xl">
                  {description}
                </p>
              )}

              {/* Bottom rule */}
              <div className="h-px bg-foreground/30 shadow-sm" />
            </div>
          </div>
          
          {/* Innhold */}
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
