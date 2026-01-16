-- Grant table privileges required for PostgREST access
-- (RLS still enforces row-level access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT INSERT ON TABLE public.support_tickets TO anon, authenticated;
GRANT SELECT, UPDATE ON TABLE public.support_tickets TO authenticated;

-- Do NOT grant SELECT to anon (keeps tickets private)
