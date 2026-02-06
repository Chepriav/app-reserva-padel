import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({
      status: 'error',
      message: 'Missing Supabase environment variables',
      timestamp: new Date().toISOString(),
    });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Simple query to keep the database active
    const { data, error } = await supabase
      .from('pistas')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[keep-alive] Supabase error:', error.message);
      return res.status(500).json({
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    console.log('[keep-alive] Ping successful');
    return res.status(200).json({
      status: 'ok',
      message: 'Supabase is alive',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[keep-alive] Exception:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}
