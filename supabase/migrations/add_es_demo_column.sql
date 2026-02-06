-- Add es_demo column to users table for view-only demo accounts
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS es_demo BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN public.users.es_demo IS 'View-only demo user - cannot make reservations or modifications';
