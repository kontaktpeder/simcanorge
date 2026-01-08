import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GarageLayout } from '@/components/ui/garage/GarageLayout';
import { EnamelCard } from '@/components/ui/garage/EnamelCard';
import { BigActionButton } from '@/components/ui/garage/BigActionButton';
import { Car, Clock, Settings, Bell, CheckCircle, Send } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';

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
    <GarageLayout
      title="Min side"
      subtitle="Bilgarasje"
      description="Her finner du bilene dine. Trykk på en bil for å legge til bilder og historie."
    >
      {/* Notifikasjoner */}
      {notifications && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <EnamelCard className="overflow-hidden p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-display text-xl flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                Varsler ({notifications.length})
              </h3>
            </div>
            <div className="divide-y divide-border">
              {notifications.map((notif: any) => (
                <div key={notif.id} className="p-5 flex items-start justify-between gap-4 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex-1">
                    <p className="font-medium text-base">{notif.title}</p>
                    <p className="text-base text-muted-foreground mt-1">{notif.body}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(notif.created_at).toLocaleDateString('nb-NO', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <BigActionButton
                    variant="ghost"
                    size="lg"
                    onClick={() => markAsRead(notif.id)}
                    icon={<CheckCircle className="w-5 h-5" />}
                  >
                    Lest
                  </BigActionButton>
                </div>
              ))}
            </div>
          </EnamelCard>
        </motion.div>
      )}

      {/* Dashboard Grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        
        {/* Mine biler - kort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Link to="/dashboard/mine-biler" className="block h-full">
            <EnamelCard className="h-full min-h-[160px] group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <div className="text-right">
                  <p className="font-display text-3xl text-primary">
                    {carsLoading ? '...' : carCount || 0}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {carCount === 1 ? 'bil' : 'biler'}
                  </p>
                </div>
              </div>
              <h3 className="font-display text-xl mb-2 group-hover:text-primary transition-colors">
                Mine biler
              </h3>
              <p className="text-base text-muted-foreground">
                Se og rediger biler du eier
              </p>
            </EnamelCard>
          </Link>
        </motion.div>

        {/* Send inn bil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Link to="/send-inn-bil" className="block h-full">
            <EnamelCard className="h-full min-h-[160px] group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Send className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="font-display text-xl mb-2 group-hover:text-primary transition-colors">
                Send inn bil
              </h3>
              <p className="text-base text-muted-foreground">
                Registrer en ny bil i registeret
              </p>
            </EnamelCard>
          </Link>
        </motion.div>

        {/* Placeholder kort - Historikk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <EnamelCard className="h-full min-h-[160px] opacity-60" hover={false}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-muted rounded-xl">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-display text-xl mb-2 text-muted-foreground">
              Historikk
            </h3>
            <p className="text-base text-muted-foreground">
              Kommer snart...
            </p>
          </EnamelCard>
        </motion.div>

        {/* Placeholder kort - Innstillinger */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <EnamelCard className="h-full min-h-[160px] opacity-60" hover={false}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-muted rounded-xl">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-display text-xl mb-2 text-muted-foreground">
              Innstillinger
            </h3>
            <p className="text-base text-muted-foreground">
              Kommer snart...
            </p>
          </EnamelCard>
        </motion.div>

      </div>
    </GarageLayout>
  );
}
