import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OwnerProfile {
  id: string;
  user_id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  location: string | null;
  favorite_brands: string[] | null;
  visible_public: boolean;
  slug: string | null;
  avatar_url: string | null;
  approved_at: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

interface OwnerProfileInsert {
  user_id: string;
  display_name: string;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  favorite_brands?: string[] | null;
  visible_public?: boolean;
}

interface OwnerProfileUpdate {
  display_name?: string;
  username?: string | null;
  bio?: string | null;
  location?: string | null;
  favorite_brands?: string[] | null;
  visible_public?: boolean;
  avatar_url?: string | null;
  approved_at?: string | null;
}

export function useOwnerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['owner-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as OwnerProfile | null;
    },
    enabled: !!userId,
  });
}

export function useOwnerProfileBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['owner-profile-slug', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .eq('slug', slug)
        .eq('visible_public', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as OwnerProfile | null;
    },
    enabled: !!slug,
  });
}

export function useOwnerCars(userId: string | undefined) {
  return useQuery({
    queryKey: ['owner-cars', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // First get the car IDs for this owner
      const { data: ownerData, error: ownerError } = await supabase
        .from('car_owners')
        .select('car_id')
        .eq('user_id', userId)
        .eq('role', 'owner');
      
      if (ownerError) throw ownerError;
      if (!ownerData || ownerData.length === 0) return [];
      
      const carIds = ownerData.map(d => d.car_id);
      
      // Then get the cars with their images
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          id,
          title,
          slug,
          brand,
          model,
          year,
          category,
          published_at,
          car_images(id, image_url, sort_order)
        `)
        .in('id', carIds)
        .not('published_at', 'is', null);
      
      if (carsError) throw carsError;
      return cars || [];
    },
    enabled: !!userId,
  });
}

export function useCarOwnerProfile(carId: string | undefined) {
  return useQuery({
    queryKey: ['car-owner-profile', carId],
    queryFn: async () => {
      if (!carId) return null;
      
      // Get all owners for this car
      const { data: carOwners, error } = await supabase
        .from('car_owners')
        .select('user_id')
        .eq('car_id', carId)
        .eq('role', 'owner');
      
      if (error) throw error;
      if (!carOwners || carOwners.length === 0) return null;
      
      const userIds = carOwners.map(co => co.user_id);
      
      // Find the first owner with a public profile
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('*')
        .in('user_id', userIds)
        .eq('visible_public', true)
        .limit(1)
        .maybeSingle();
      
      if (ownerError) throw ownerError;
      return owner as OwnerProfile | null;
    },
    enabled: !!carId,
  });
}

export function useCreateOwnerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (profile: OwnerProfileInsert) => {
      const { data, error } = await supabase
        .from('owners')
        .insert(profile)
        .select()
        .single();
      
      if (error) throw error;
      return data as OwnerProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-profile', data.user_id] });
      toast({
        title: 'Profil opprettet',
        description: 'Din profil er opprettet og venter på godkjenning.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke opprette eierprofil.',
        variant: 'destructive',
      });
      console.error('Create owner profile error:', error);
    },
  });
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: OwnerProfileUpdate }) => {
      const { data, error } = await supabase
        .from('owners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as OwnerProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-profile', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile-slug', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['all-owner-profiles'] });
      toast({
        title: 'Profil oppdatert',
        description: 'Endringene dine er lagret.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere eierprofil.',
        variant: 'destructive',
      });
      console.error('Update owner profile error:', error);
    },
  });
}

export function useAllOwnerProfiles() {
  return useQuery({
    queryKey: ['all-owner-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as OwnerProfile[];
    },
  });
}
