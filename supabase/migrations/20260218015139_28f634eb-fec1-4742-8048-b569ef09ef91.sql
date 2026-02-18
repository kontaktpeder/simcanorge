
-- Drop old FK pointing to marketplace_categories
ALTER TABLE public.marketplace_items DROP CONSTRAINT IF EXISTS marketplace_items_category_id_fkey;

-- Null out any category_id that doesn't exist in categories
UPDATE public.marketplace_items
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.categories WHERE id = marketplace_items.category_id);

-- Add new FK pointing to categories
ALTER TABLE public.marketplace_items
  ADD CONSTRAINT marketplace_items_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
