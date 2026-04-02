import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketplaceItem {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_note: string | null;
  category_id: string | null;
  location: string | null;
  contact_mode: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MarketplaceImage {
  id: string;
  item_id: string;
  image_url: string;
  sort_order: number;
  alt_text: string | null;
  created_at: string;
}

// Fetch published marketplace items (public)
export function useMarketplaceItems(filters?: { categoryId?: string; search?: string }) {
  return useQuery({
    queryKey: ['marketplace-items', filters],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug),
          person_profiles!marketplace_items_person_profile_id_fkey(id, display_name, slug, location, avatar_url, contact_email, contact_phone)
        `)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// Fetch single marketplace item by slug (public)
export function useMarketplaceItemBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['marketplace-item-slug', slug],
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug),
          owners!inner(id, display_name, slug, location, avatar_url, bio, contact_email, contact_phone)
        `)
        .eq('slug', slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

// Fetch marketplace items for a specific owner (for profile page)
export function useOwnerListings(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['owner-listings', ownerId],
    queryFn: async () => {
      if (!ownerId) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text)
        `)
        .eq('owner_id', ownerId)
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!ownerId,
  });
}

// Fetch current user's listings (for dashboard)
export function useMyListings(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-listings', userId],
    queryFn: async () => {
      if (!userId) return [];

      // First get the owner profile
      const { data: owner, error: ownerError } = await supabase
        .from('owners')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (ownerError) throw ownerError;
      if (!owner) return [];

      const { data, error } = await supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug)
        `)
        .eq('owner_id', owner.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
}

// Fetch marketplace categories
export function useMarketplaceCategories() {
  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as MarketplaceCategory[];
    },
  });
}

// Create marketplace item
export function useCreateMarketplaceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: {
      owner_id: string;
      title: string;
      description?: string | null;
      price?: number | null;
      price_note?: string | null;
      category_id?: string | null;
      location?: string | null;
      contact_mode?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .insert({ ...item, slug: '' }) // slug generated by trigger
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      toast({ title: 'Annonse opprettet', description: 'Annonsen din er lagret.' });
    },
    onError: (error) => {
      toast({ title: 'Feil', description: 'Kunne ikke opprette annonse.', variant: 'destructive' });
      console.error('Create marketplace item error:', error);
    },
  });
}

// Update marketplace item
export function useUpdateMarketplaceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MarketplaceItem> }) => {
      const { data, error } = await supabase
        .from('marketplace_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-item-slug', data.slug] });
      toast({ title: 'Annonse oppdatert', description: 'Endringene er lagret.' });
    },
    onError: (error) => {
      toast({ title: 'Feil', description: 'Kunne ikke oppdatere annonse.', variant: 'destructive' });
      console.error('Update marketplace item error:', error);
    },
  });
}

// Insert marketplace images
export function useInsertMarketplaceImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, images }: { itemId: string; images: { image_url: string; sort_order: number }[] }) => {
      const rows = images.map((img) => ({
        item_id: itemId,
        image_url: img.image_url,
        sort_order: img.sort_order,
      }));

      const { data, error } = await supabase
        .from('marketplace_images')
        .insert(rows)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-item', variables.itemId] });
    },
  });
}

// Fetch all marketplace items for admin (no published_at filter)
export function useAdminMarketplaceItems(statusFilter?: string) {
  return useQuery({
    queryKey: ['admin-marketplace-items', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_items')
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug),
          owners(id, display_name, slug, user_id)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'alle') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// Delete marketplace image
export function useDeleteMarketplaceImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ imageId, itemId }: { imageId: string; itemId: string }) => {
      const { error } = await supabase
        .from('marketplace_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      return { imageId, itemId };
    },
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-item', itemId] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-item-slug'] });
      toast({ title: 'Bilde slettet' });
    },
    onError: () => {
      toast({ title: 'Feil', description: 'Kunne ikke slette bilde.', variant: 'destructive' });
    },
  });
}

// Delete marketplace item
export function useDeleteMarketplaceItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketplace_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-items'] });
      toast({ title: 'Annonse slettet' });
    },
    onError: () => {
      toast({ title: 'Feil', description: 'Kunne ikke slette annonse.', variant: 'destructive' });
    },
  });
}

// Reorder marketplace images
export function useReorderMarketplaceImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ images }: { images: { id: string; sort_order: number }[] }) => {
      for (const img of images) {
        const { error } = await supabase
          .from('marketplace_images')
          .update({ sort_order: img.sort_order })
          .eq('id', img.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-items'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-item-slug'] });
    },
  });
}

// Fetch marketplace images for an item
export function useMarketplaceImages(itemId: string | undefined) {
  return useQuery({
    queryKey: ['marketplace-images', itemId],
    queryFn: async () => {
      if (!itemId) return [];

      const { data, error } = await supabase
        .from('marketplace_images')
        .select('*')
        .eq('item_id', itemId)
        .order('sort_order');

      if (error) throw error;
      return (data || []) as MarketplaceImage[];
    },
    enabled: !!itemId,
  });
}
