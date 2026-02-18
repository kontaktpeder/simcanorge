import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ArrowLeft, HelpCircle, Sparkles } from 'lucide-react';
import { useGuide } from '@/hooks/useGuide';
import { BigActionButton } from './BigActionButton';
import garageBackground from '@/assets/garage-background.jpg';

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
      <div className="relative min-h-[calc(100vh-80px)] min-h-[calc(100dvh-80px)]">
        {/* Bakgrunnsbilde */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10 will-change-transform"
          style={{ 
            backgroundImage: `url(${garageBackground})`,
            backgroundAttachment: 'scroll' // Bedre ytelse på mobil
          }}
        />
        
        {/* Overlay for lesbarhet */}
        <div className="fixed inset-0 bg-background/60 -z-10 will-change-transform" />
        
        {/* Innhold */}
        <div className="container px-4 sm:px-6 py-6 sm:py-8 animate-fade-in pb-safe">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-base sm:text-lg min-h-[44px] active:scale-95 touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{backLabel}</span>
              </Link>
            )}
            
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight break-words hyphens-auto">
                  {subtitle || title}
                </h1>
                
                {/* Guide-knapper – høyrestilt */}
                <div className="flex items-center gap-2">
                  {isDashboardRoot && !guideLoading && shouldShowGuide && (
                    <BigActionButton
                      onClick={() => startGuide('full')}
                      size="lg"
                      icon={<Sparkles className="w-5 h-5" />}
                      className="animate-pulse-subtle"
                    >
                      Start guide
                    </BigActionButton>
                  )}
                  
                  {isDashboardRoot && !guideLoading && !shouldShowGuide && (
                    <button
                      onClick={() => startGuide('full')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border hover:border-primary/30 transition-colors text-sm font-medium"
                    >
                      <HelpCircle className="w-4 h-4" />
                      Skal vi vise deg rundt?
                    </button>
                  )}
                </div>
              </div>
              {description && (
                <p className="text-base sm:text-lg text-muted-foreground/90 max-w-2xl font-medium">
                  {description}
                </p>
              )}
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
