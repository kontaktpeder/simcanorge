import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Car, Clock, Settings, Bell, CheckCircle } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Redirect hvis ikke innlogget
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Hent antall biler
  const { data: carCount, isLoading: carsLoading } = useQuery({
    queryKey: ['my-cars-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from('car_owners')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'owner');
      return count || 0;
    },
    enabled: !!user
  });

  // Hent uleste notifikasjoner
  const { data: notifications } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user
  });

  // Marker som lest
  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  if (authLoading) {
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
    <Layout>
      <PageHeader 
        title="Min side" 
        subtitle="Velkommen til din Simca-portal"
      />

      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Notifikasjoner */}
          {notifications && notifications.length > 0 && (
            <div className="mb-6 bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-display text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Varsler ({notifications.length})
                </h3>
              </div>
              <div className="divide-y divide-border">
                {notifications.map((notif: any) => (
                  <div key={notif.id} className="p-4 flex items-start justify-between gap-4 bg-amber-50/50">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(notif.id)}
                      className="shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dashboard Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            
            {/* Mine biler - kort */}
            <Link 
              to="/dashboard/mine-biler"
              className="group bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Car className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-primary">
                    {carsLoading ? '...' : carCount || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {carCount === 1 ? 'bil' : 'biler'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-lg mb-1 group-hover:text-primary transition-colors">
                Mine biler
              </h3>
              <p className="text-sm text-muted-foreground">
                Se og rediger biler du eier
              </p>
            </Link>

            {/* Placeholder kort - Kommer snart */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Clock className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-display text-lg mb-1 text-muted-foreground">
                Historikk
              </h3>
              <p className="text-sm text-muted-foreground">
                Kommer snart...
              </p>
            </div>

            {/* Placeholder kort - Innstillinger */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 opacity-60">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-muted rounded-xl">
                  <Settings className="w-6 h-6 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-display text-lg mb-1 text-muted-foreground">
                Innstillinger
              </h3>
              <p className="text-sm text-muted-foreground">
                Kommer snart...
              </p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
