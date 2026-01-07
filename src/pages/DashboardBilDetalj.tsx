import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArrowLeft, Car, Calendar, Wrench, Loader2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DashboardBilDetalj() {
  const { carId } = useParams<{ carId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Sjekk tilgang og hent bil
  const { data: carData, isLoading } = useQuery({
    queryKey: ['my-car', carId, user?.id],
    queryFn: async () => {
      if (!user || !carId) return null;

      // Sjekk om bruker eier bilen
      const { data: ownerCheck } = await supabase
        .from('car_owners')
        .select('id')
        .eq('car_id', carId)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!ownerCheck) {
        return { hasAccess: false };
      }

      // Hent bil-data
      const { data: car, error } = await supabase
        .from('cars')
        .select(`
          *,
          car_images(id, image_url, alt_text, sort_order)
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      return { hasAccess: true, car };
    },
    enabled: !!user && !!carId
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

  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <PageHeader title="Ingen tilgang" />
        <div className="container py-8">
          <div className="max-w-md mx-auto text-center bg-card border border-border rounded-xl p-8">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground mb-6">
              Du har ikke tilgang til denne bilen.
            </p>
            <Link to="/dashboard/mine-biler">
              <Button variant="outline">Tilbake til mine biler</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!carData?.car) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Bil ikke funnet</p>
        </div>
      </Layout>
    );
  }

  const car = carData.car;
  const sortedImages = [...(car.car_images || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publisert' },
      submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Venter på godkjenning' },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Kladd' },
      archived: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Arkivert' },
    };
    const { bg, text, label } = config[status] || config.draft;
    return <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>{label}</span>;
  };

  return (
    <Layout>
      <PageHeader title={car.title} />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/dashboard/mine-biler" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til mine biler
          </Link>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {/* Hovedbilde */}
            <div className="aspect-video bg-muted">
              {sortedImages[0] ? (
                <img 
                  src={sortedImages[0].image_url} 
                  alt={car.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-16 h-16 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {getStatusBadge(car.status)}
                {car.year && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {car.year}
                  </span>
                )}
                {car.overhauled && (
                  <span className="inline-flex items-center gap-1 text-sm text-green-600">
                    <Wrench className="w-4 h-4" />
                    Overhalt
                  </span>
                )}
              </div>

              {car.status === 'submitted' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Bilen din er sendt inn og venter på godkjenning fra admin. 
                    Du vil få beskjed når den er publisert.
                  </p>
                </div>
              )}

              {car.story && (
                <div className="mb-6">
                  <h2 className="font-display text-lg mb-2">Historien</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{car.story}</p>
                </div>
              )}

              {/* Flere bilder */}
              {sortedImages.length > 1 && (
                <div>
                  <h2 className="font-display text-lg mb-3">Flere bilder</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sortedImages.slice(1).map((img: any) => (
                      <div key={img.id} className="aspect-video rounded-lg overflow-hidden bg-muted">
                        <img 
                          src={img.image_url} 
                          alt={img.alt_text || car.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Link til offentlig side hvis publisert */}
              {car.status === 'published' && car.slug && (
                <div className="mt-6 pt-6 border-t border-border">
                  <Link 
                    to={`/biler/${car.slug}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Se offentlig side →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
