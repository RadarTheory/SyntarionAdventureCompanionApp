// supabase/functions/scribe/index.ts
// Server-side Gemini relay for Syntarion's Scribe.
// The API key lives ONLY here (Supabase secret), never in the client bundle.
// Requires a logged-in Supabase user — anonymous internet traffic gets 401.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    // ── Auth: only signed-in Syntarion users may use the relay ──
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: { message: 'The archives do not answer strangers.' } }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // ── Relay to Gemini ──
    const { system, messages, max_tokens = 1024 } = await req.json();
    if (!system || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: { message: 'Bad request: system and messages required.' } }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: Math.min(max_tokens, 2048),
        temperature: 0.82,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: String(e) } }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
