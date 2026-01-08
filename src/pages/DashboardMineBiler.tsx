import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { CarCardLarge } from '@/components/ui/garage/CarCardLarge';
import { EmptyState } from '@/components/ui/garage/EmptyState';
import { Car, Loader2, Send } from 'lucide-react';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';

interface CarImage {
  id: string;
  image_url: string;
  sort_order: number | null;
}

interface CarData {
  id: string;
  title: string;
  slug: string;
  status: 'submitted' | 'draft' | 'published' | 'archived';
  source: string;
  year: number | null;
  category: string;
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
            year,
            category,
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

  return (
    <GarageLayout
      title="Mine biler"
      subtitle="Bilgarasje"
      description="Trykk på en bil for å legge til bilder og historie."
      showBackButton
      backTo="/dashboard"
      backLabel="Til Min side"
    >
      {!myCars || myCars.length === 0 ? (
        <EmptyState
          icon={<Car />}
          title="Du har ingen biler ennå"
          description="Ta kontakt med admin for å få tilgang, eller send inn din bil."
          action={{
            label: 'Send inn din bil',
            onClick: () => navigate('/send-inn-bil'),
            icon: <Send className="w-5 h-5" />,
          }}
        />
      ) : (
        <div className="grid gap-4">
          {myCars.map(({ cars: car }, index) => {
            if (!car) return null;
            
            return (
              <CarCardLarge
                key={car.id}
                car={car}
                onClick={() => navigate(`/dashboard/bil/${car.id}`)}
                index={index}
              />
            );
          })}
        </div>
      )}
    </GarageLayout>
  );
}
