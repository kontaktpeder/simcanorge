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
      <div className="relative min-h-[calc(100vh-80px)]">
        {/* Bakgrunnsbilde */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${garageBackground})` }}
        />
        
        {/* Overlay for lesbarhet */}
        <div className="fixed inset-0 bg-background/60 -z-10" />
        
        {/* Innhold */}
        <div className="container px-4 sm:px-6 py-6 sm:py-8 animate-fade-in">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-6 sm:mb-8">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors text-base sm:text-lg min-h-[48px] active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                {backLabel}
              </Link>
            )}
            
            <div className="space-y-1 sm:space-y-2">
              {subtitle && (
                <p className="text-xs sm:text-sm font-medium text-primary uppercase tracking-wider">
                  {subtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-foreground leading-tight">
                  {title}
                </h1>
                
                {/* Guide-knapp - tydelig i headeren */}
                {isDashboardRoot && !guideLoading && shouldShowGuide && (
                  <BigActionButton
                    onClick={startGuide}
                    size="lg"
                    icon={<Sparkles className="w-5 h-5" />}
                    className="animate-pulse-subtle"
                  >
                    Start guide
                  </BigActionButton>
                )}
                
                {/* Hjelp-knapp for å starte guide manuelt (vises alltid på dashboard) */}
                {isDashboardRoot && !guideLoading && !shouldShowGuide && (
                  <button
                    onClick={startGuide}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Start garasje-guiden"
                  >
                    <HelpCircle className="w-6 h-6" />
                  </button>
                )}
              </div>
              {description && (
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
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
