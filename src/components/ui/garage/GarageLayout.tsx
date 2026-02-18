import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';
import { useGuide } from '@/hooks/useGuide';
import { BigActionButton } from './BigActionButton';

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
  const location = useLocation();
  const { shouldShowGuide, startGuide, isLoading: guideLoading } = useGuide();
  const isDashboardRoot = location.pathname === '/dashboard';

  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)]" style={{ background: 'hsl(42, 30%, 93%)' }}>
        {/* Innhold */}
        <div className="container px-4 sm:px-6 py-8 sm:py-12 animate-fade-in pb-safe">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8 sm:mb-12">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors font-display text-xs uppercase tracking-[0.2em] min-h-[44px] active:scale-95 touch-manipulation"
              >
                <ArrowLeft className="w-4 h-4 flex-shrink-0" />
                <span>{backLabel}</span>
              </Link>
            )}
            
            {/* Editorial header */}
            <div className="space-y-4">
              {/* Top rule */}
              <div className="w-12 h-0.5" style={{ background: 'hsl(2, 85%, 40%)' }} />
              
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                  {title !== (subtitle || title) && (
                    <p className="font-display text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground">
                      {title}
                    </p>
                  )}
                  <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-foreground uppercase tracking-wider leading-[0.9]">
                    {subtitle || title}
                  </h1>
                </div>
                
                {/* Guide-knapper – høyrestilt */}
                <div className="flex items-center gap-2">
                  {isDashboardRoot && !guideLoading && shouldShowGuide && (
                    <BigActionButton
                      onClick={() => startGuide('full')}
                      size="lg"
                      icon={<Sparkles className="w-4 h-4" />}
                      className="animate-pulse-subtle"
                    >
                      Start guide
                    </BigActionButton>
                  )}
                  
                  {isDashboardRoot && !guideLoading && !shouldShowGuide && (
                    <button
                      onClick={() => startGuide('full')}
                      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-foreground/15 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-all font-display text-[10px] uppercase tracking-[0.2em]"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Veiledning
                    </button>
                  )}
                </div>
              </div>

              {description && (
                <p className="font-serif italic text-base sm:text-lg text-muted-foreground max-w-xl">
                  {description}
                </p>
              )}

              {/* Bottom rule */}
              <div className="h-px bg-foreground/15" />
            </div>
          </div>
          
          {/* Innhold */}
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>
      </div>
    </Layout>
  );
}
