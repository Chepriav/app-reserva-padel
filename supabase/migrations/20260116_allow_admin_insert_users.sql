-- Migration: Allow admins to insert users for CSV import
-- This policy allows admin users to insert new user records

-- First, check if the policy already exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'users'
        AND policyname = 'Admins can insert users'
    ) THEN
        DROP POLICY "Admins can insert users" ON public.users;
    END IF;
END $$;

-- Create policy to allow admins to insert new users
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND es_admin = true
        )
    );

-- Also ensure admins can update users (for approval, etc.)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'users'
        AND policyname = 'Admins can update users'
    ) THEN
        DROP POLICY "Admins can update users" ON public.users;
    END IF;
END $$;

CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND es_admin = true
        )
    );
