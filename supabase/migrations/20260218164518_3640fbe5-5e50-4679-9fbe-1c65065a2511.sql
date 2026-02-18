
-- Drop and re-add marketplace_images foreign key with CASCADE
ALTER TABLE public.marketplace_images
  DROP CONSTRAINT marketplace_images_item_id_fkey,
  ADD CONSTRAINT marketplace_images_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.marketplace_items(id) ON DELETE CASCADE;

-- Drop and re-add inquiry_items foreign key with CASCADE
ALTER TABLE public.inquiry_items
  DROP CONSTRAINT inquiry_items_marketplace_item_id_fkey,
  ADD CONSTRAINT inquiry_items_marketplace_item_id_fkey
    FOREIGN KEY (marketplace_item_id) REFERENCES public.marketplace_items(id) ON DELETE CASCADE;
