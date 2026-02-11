/**
 * Re-export Supabase client from existing config.
 * New domain code imports from here; legacy code keeps using services/supabaseConfig.
 */
export { supabase, refreshSession } from '../../services/supabaseConfig';
