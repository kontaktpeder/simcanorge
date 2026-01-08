import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ArrowLeft } from 'lucide-react';
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
  return (
    <Layout>
      <div className="relative min-h-[calc(100vh-80px)]">
        {/* Bakgrunnsbilde */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${garageBackground})` }}
        />
        
        {/* Overlay for lesbarhet */}
        <div className="fixed inset-0 bg-background/85 backdrop-blur-sm -z-10" />
        
        {/* Innhold */}
        <div className="container py-8 animate-fade-in">
          {/* Header */}
          <div className="max-w-4xl mx-auto mb-8">
            {showBackButton && (
              <Link
                to={backTo}
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors text-lg min-h-[48px]"
              >
                <ArrowLeft className="w-5 h-5" />
                {backLabel}
              </Link>
            )}
            
            <div className="space-y-2">
              {subtitle && (
                <p className="text-sm font-medium text-primary uppercase tracking-wider">
                  {subtitle}
                </p>
              )}
              <h1 className="font-display text-3xl md:text-4xl text-foreground">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-muted-foreground max-w-2xl">
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
