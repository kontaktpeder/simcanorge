import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArrowLeft, Car, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface CarImage {
  id: string;
  image_url: string;
  sort_order: number | null;
}

interface CarData {
  id: string;
  title: string;
  slug: string;
  status: string;
  source: string;
  created_at: string;
  updated_at: string;
  car_images: CarImage[];
}

interface MyCar {
  car_id: string;
  role: string;
  cars: CarData;
}

export default function DashboardMineBiler() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard/mine-biler');
    }
  }, [user, authLoading, navigate]);

  const { data: myCars, isLoading } = useQuery({
    queryKey: ['my-cars', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('car_owners')
        .select(`
          car_id,
          role,
          cars:car_id (
            id,
            title,
            slug,
            status,
            source,
            created_at,
            updated_at,
            car_images(id, image_url, sort_order)
          )
        `)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as MyCar[]) || [];
    },
    enabled: !!user
  });

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publisert' },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Godkjent' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Kladd' },
      archived: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Arkivert' },
    };
    const { bg, text, label } = config[status] || config.draft;
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>{label}</span>;
  };

  return (
    <Layout>
      <PageHeader title="Mine biler" subtitle="Biler du eier og har tilgang til" />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til dashboard
          </Link>

          {!myCars || myCars.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <Car className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h2 className="font-display text-xl mb-2">Ingen biler ennå</h2>
              <p className="text-muted-foreground">
                Du har ingen biler ennå. Ta kontakt med admin for å få tilgang.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {myCars.map(({ cars: car }) => {
                if (!car) return null;
                
                const sortedImages = [...(car.car_images || [])].sort(
                  (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
                );
                const mainImage = sortedImages[0];
                
                return (
                  <Link
                    key={car.id}
                    to={`/dashboard/bil/${car.id}`}
                    className="flex gap-4 bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-lg transition-all group"
                  >
                    {/* Bilde */}
                    <div className="w-24 h-24 md:w-32 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                      {mainImage ? (
                        <img 
                          src={mainImage.image_url} 
                          alt={car.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg truncate group-hover:text-primary transition-colors">
                        {car.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(car.status)}
                        <span className="text-xs text-muted-foreground">
                          Oppdatert: {new Date(car.updated_at).toLocaleDateString('nb-NO')}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
