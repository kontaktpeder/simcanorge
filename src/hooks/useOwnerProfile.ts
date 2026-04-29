import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Legacy: get owners.id for FK-dependent queries (inquiries, marketplace_items.owner_id)
export function useLegacyOwnerId(userId: string | undefined) {
  return useQuery({
    queryKey: ['legacy-owner-id', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.id ?? null;
    },
    enabled: !!userId,
  });
}

// Unified profile interface — all data now lives in person_profiles
export interface OwnerProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_public: boolean;
  can_create_pages: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  favorite_brands: string[] | null;
  visible_public: boolean;
  approved_at: string | null;
  requested_approval_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicOwnerProfile {
  id: string;
  user_id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_public: boolean | null;
  can_create_pages: boolean | null;
  favorite_brands: string[] | null;
  visible_public: boolean | null;
  approved_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const OWNER_PROFILE_COLUMNS =
  'id, user_id, display_name, slug, bio, location, avatar_url, cover_url, is_public, can_create_pages, contact_email, contact_phone, favorite_brands, visible_public, approved_at, requested_approval_at, created_at, updated_at';

const PUBLIC_PERSON_PROFILE_COLUMNS =
  'id, user_id, display_name, slug, bio, avatar_url, cover_url, location, favorite_brands, is_public, can_create_pages, visible_public, approved_at, created_at, updated_at';

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
        .from('person_profiles')
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
        .from('person_profiles')
        .select('*')
        .eq('slug', slug)
        .eq('is_public', true)
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

      const { data: ownerData, error: ownerError } = await supabase
        .from('car_owners')
        .select('car_id')
        .eq('user_id', userId)
        .eq('role', 'owner');

      if (ownerError) throw ownerError;
      if (!ownerData || ownerData.length === 0) return [];

      const carIds = ownerData.map(d => d.car_id);

      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select(`
          id, title, slug, brand, model, year, category, published_at,
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

      const { data: carOwners, error } = await supabase
        .from('car_owners')
        .select('user_id')
        .eq('car_id', carId)
        .eq('role', 'owner');

      if (error) throw error;
      if (!carOwners || carOwners.length === 0) return null;

      const userIds = carOwners.map(co => co.user_id);

      const { data: profile, error: profileError } = await supabase
        .from('person_profiles')
        .select('*')
        .in('user_id', userIds)
        .eq('is_public', true)
        .limit(1)
        .maybeSingle();

      if (profileError) throw profileError;
      return profile as OwnerProfile | null;
    },
    enabled: !!carId,
  });
}

export function useUpdateOwnerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<OwnerProfile> }) => {
      const { data, error } = await supabase
        .from('person_profiles')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as OwnerProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-profile', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile-slug', data.slug] });
      queryClient.invalidateQueries({ queryKey: ['all-owner-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['person_profile'] });
      toast({
        title: 'Profil oppdatert',
        description: 'Endringene dine er lagret.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke oppdatere profil.',
        variant: 'destructive',
      });
      console.error('Update profile error:', error);
    },
  });
}

export function useCreateOwnerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (profile: { user_id: string; display_name: string; bio?: string | null; location?: string | null; favorite_brands?: string[] | null; visible_public?: boolean }) => {
      // person_profiles should already exist, so upsert
      const { data, error } = await supabase
        .from('person_profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio ?? null,
          location: profile.location ?? null,
          favorite_brands: profile.favorite_brands ?? null,
          visible_public: profile.visible_public ?? false,
        } as any)
        .eq('user_id', profile.user_id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as OwnerProfile;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['owner-profile', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['person_profile'] });
      toast({
        title: 'Profil opprettet',
        description: 'Din profil er opprettet og venter på godkjenning.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Feil',
        description: 'Kunne ikke opprette profil.',
        variant: 'destructive',
      });
      console.error('Create profile error:', error);
    },
  });
}

export function useAllOwnerProfiles() {
  return useQuery({
    queryKey: ['all-owner-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('person_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as OwnerProfile[]) || [];
    },
  });
}
