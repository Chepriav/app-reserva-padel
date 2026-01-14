-- =====================================================
-- Fix RLS Security Issues
-- =====================================================
-- This migration enables Row Level Security (RLS) on tables
-- that were exposed without proper security policies.
-- Date: 2026-01-14
-- =====================================================

-- =====================================================
-- 1. PUSH_TOKENS TABLE
-- =====================================================
-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can insert their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can update their own push tokens" ON public.push_tokens;
DROP POLICY IF EXISTS "Users can delete their own push tokens" ON public.push_tokens;

-- Policy: Users can only view their own push tokens
CREATE POLICY "Users can view their own push tokens"
ON public.push_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own push tokens
CREATE POLICY "Users can insert their own push tokens"
ON public.push_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own push tokens
CREATE POLICY "Users can update their own push tokens"
ON public.push_tokens
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own push tokens
CREATE POLICY "Users can delete their own push tokens"
ON public.push_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 2. WEB_PUSH_SUBSCRIPTIONS TABLE
-- =====================================================
-- Enable RLS
ALTER TABLE public.web_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own web push subscriptions" ON public.web_push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own web push subscriptions" ON public.web_push_subscriptions;

-- Policy: Users can only view their own web push subscriptions
CREATE POLICY "Users can view their own web push subscriptions"
ON public.web_push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own web push subscriptions
CREATE POLICY "Users can insert their own web push subscriptions"
ON public.web_push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own web push subscriptions
CREATE POLICY "Users can update their own web push subscriptions"
ON public.web_push_subscriptions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own web push subscriptions
CREATE POLICY "Users can delete their own web push subscriptions"
ON public.web_push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- =====================================================
-- 3. NOTIFICACIONES_DESPLAZAMIENTO TABLE
-- =====================================================
-- Enable RLS
ALTER TABLE public.notificaciones_desplazamiento ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "System can manage displacement notifications" ON public.notificaciones_desplazamiento;

-- Policy: System role can manage all notifications (service_role bypass RLS anyway)
-- Regular users won't be able to access this table directly via API
CREATE POLICY "System can manage displacement notifications"
ON public.notificaciones_desplazamiento
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. CONVERSION_QUEUE TABLE
-- =====================================================
-- Enable RLS
ALTER TABLE public.conversion_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "System can manage conversion queue" ON public.conversion_queue;

-- Policy: Service role can manage the conversion queue (used by cron jobs/functions)
-- Regular users won't be able to access this table directly via API
CREATE POLICY "System can manage conversion queue"
ON public.conversion_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "Users can view their own push tokens" ON public.push_tokens IS
'Users can only access their own push notification tokens';

COMMENT ON POLICY "Users can view their own web push subscriptions" ON public.web_push_subscriptions IS
'Users can only access their own web push subscriptions';

COMMENT ON POLICY "System can manage displacement notifications" ON public.notificaciones_desplazamiento IS
'System processes can manage displacement notifications';

COMMENT ON POLICY "System can manage conversion queue" ON public.conversion_queue IS
'Automated processes can manage the conversion queue';
