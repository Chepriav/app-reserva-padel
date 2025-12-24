-- Migration: Add vivienda column to reservas table
-- This allows tracking reservations by housing unit (vivienda)
-- The reservation limit is now per housing unit, not per user

-- Step 1: Add vivienda column to reservas table
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS vivienda TEXT;

-- Step 2: Populate vivienda from existing users
-- This copies the vivienda value from the user who made each reservation
UPDATE public.reservas r
SET vivienda = u.vivienda
FROM public.users u
WHERE r.usuario_id = u.id
AND r.vivienda IS NULL;

-- Step 3: Create index for faster queries by vivienda
CREATE INDEX IF NOT EXISTS idx_reservas_vivienda ON public.reservas(vivienda);

-- Step 4: Create index for combined vivienda + fecha + estado queries
CREATE INDEX IF NOT EXISTS idx_reservas_vivienda_fecha_estado
ON public.reservas(vivienda, fecha, estado);

-- Verification query (run this to check the migration worked)
-- SELECT id, usuario_id, usuario_nombre, vivienda, fecha, estado
-- FROM public.reservas
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Note: The vivienda format is now structured as "escalera-piso-puerta"
-- Example: "1-3-B" = Escalera 1, Piso 3, Puerta B
--
-- Users with old format viviendas will be prompted to update their profile
-- to the new structured format when they log in.
