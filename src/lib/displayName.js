import { useEffect, useState } from 'react';
import supabase from './supabase';

export function displayNameFromUser(user, fallback = '') {
  const meta = user?.user_metadata || {};
  return (
    meta.display_name ||
    meta.full_name ||
    meta.name ||
    user?.email?.split('@')[0] ||
    fallback ||
    ''
  ).trim();
}

export function useDisplayName(fallback = '') {
  const [displayName, setDisplayName] = useState(fallback);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setDisplayName(displayNameFromUser(data?.user, fallback));
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setDisplayName(displayNameFromUser(session?.user, fallback));
    });
    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [fallback]);

  return displayName || fallback;
}
