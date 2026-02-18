import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export function useUnifiedCategories() {
  return useQuery({
    queryKey: ['unified-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, parent_id')
        .order('name');
      if (error) throw error;
      return (data || []) as Category[];
    },
  });
}

export function getRootCategories(categories: Category[]): Category[] {
  return categories.filter((c) => !c.parent_id);
}

export function getSubcategories(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parent_id === parentId);
}

/** Get all descendants (children + grandchildren) of a parent */
export function getAllDescendants(categories: Category[], parentId: string): Category[] {
  const children = categories.filter((c) => c.parent_id === parentId);
  const descendants = [...children];
  for (const child of children) {
    descendants.push(...getAllDescendants(categories, child.id));
  }
  return descendants;
}

export function getCategoryPath(categories: Category[], categoryId: string): Category[] {
  const path: Category[] = [];
  let current = categories.find((c) => c.id === categoryId);
  while (current) {
    path.unshift(current);
    current = current.parent_id
      ? categories.find((c) => c.id === current!.parent_id) ?? undefined
      : undefined;
  }
  return path;
}

export function getRootSlug(categories: Category[], categoryId: string): string | null {
  const path = getCategoryPath(categories, categoryId);
  return path[0]?.slug ?? null;
}
