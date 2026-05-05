import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default supabase;

export function getMusicUrl(path) {
  return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/music/${path}`;
}