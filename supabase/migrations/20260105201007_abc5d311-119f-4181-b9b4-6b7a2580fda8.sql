-- Drop existing restrictive policy and create permissive one
DROP POLICY IF EXISTS "Admins can view inquiries" ON public.inquiries;

CREATE POLICY "Admins can view inquiries" 
ON public.inquiries 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Same for inquiry_items
DROP POLICY IF EXISTS "Admins can view inquiry items" ON public.inquiry_items;

CREATE POLICY "Admins can view inquiry items" 
ON public.inquiry_items 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));