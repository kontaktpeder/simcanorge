ALTER TABLE public.parts ADD COLUMN condition text DEFAULT NULL;

COMMENT ON COLUMN public.parts.condition IS 'Part condition: Ny, Brukt, NOS, Original, Repro';
