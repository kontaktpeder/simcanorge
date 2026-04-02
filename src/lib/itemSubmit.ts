import { supabase } from '@/integrations/supabase/client';
import { getRootSlug, type Category } from '@/hooks/useUnifiedCategories';

export type SubmitTarget = 'part' | 'listing';

export interface ItemFormValues {
  title: string;
  description: string;
  rootCategoryId: string;
  categoryId: string;
  priceMin: string;
  priceMax: string;
  priceNote: string;
  condition: string;
  showLocation: boolean;
  // Optional car context – which car does this part/listing relate to?
  carBrand?: string;
  carModel?: string;
  carVariant?: string;
  carYear?: string;
}

export function getSubmitTarget(
  categories: Category[],
  rootCategoryId: string
): SubmitTarget {
  const cat = categories.find((c) => c.id === rootCategoryId);
  return cat?.slug === 'deler' ? 'part' : 'listing';
}

export async function submitAsPart(
  values: ItemFormValues,
  options: { editingId?: string; imageUrl?: string }
) {
  const payload = {
    title: values.title.trim(),
    description: values.description.trim() || null,
    category_id: values.categoryId || null,
    price_min: values.priceMin ? Number(values.priceMin) : null,
    price_max: values.priceMax ? Number(values.priceMax) : null,
    price_note: values.priceNote.trim() || null,
    condition: values.condition || null,
    ...(options.imageUrl && { image_url: options.imageUrl }),
  };

  if (options.editingId) {
    const { data, error } = await supabase
      .from('parts')
      .update(payload)
      .eq('id', options.editingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('parts')
    .insert({ ...payload, published: false })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function submitAsListing(
  values: ItemFormValues,
  options: { ownerId: string; personProfileId?: string; editingId?: string; profileLocation?: string | null }
) {
  const price = values.priceMin
    ? Number(values.priceMin)
    : values.priceMax
      ? Number(values.priceMax)
      : null;

  const location = values.showLocation && options.profileLocation
    ? options.profileLocation.trim()
    : null;

  const payload = {
    title: values.title.trim(),
    description: values.description.trim() || null,
    category_id: values.categoryId || null,
    price,
    price_note: values.priceNote.trim() || null,
    location,
  };

  if (options.editingId) {
    const { data, error } = await supabase
      .from('marketplace_items')
      .update(payload)
      .eq('id', options.editingId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('marketplace_items')
    .insert({
      ...payload,
      owner_id: options.ownerId,
      person_profile_id: (options.personProfileId || options.ownerId) as any,
      slug: '',
      status: 'submitted',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
