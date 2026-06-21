// supabase/functions/transcribe/index.ts
// Deploy with: supabase functions deploy transcribe
// Requires a GROQ_API_KEY secret: supabase secrets set GROQ_API_KEY=your_key_here
// Get a free Groq key (no credit card) at https://console.groq.com

// supabase/functions/transcribe/index.ts
// Relays a short audio clip to Groq's Whisper API and returns text only.
// The audio is never written to disk or any table — decoded in memory, sent, discarded.
// Requires a logged-in Syntarion user, same as scribe.

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
      return new Response(JSON.stringify({ error: 'The archives do not answer strangers.' }), {
        status: 401, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const { audioBase64, mimeType } = await req.json();
    if (!audioBase64) {
      return new Response(JSON.stringify({ error: 'No audio provided.' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const groqKey = Deno.env.get('GROQ_API_KEY');
    if (!groqKey) {
      return new Response(JSON.stringify({ error: 'Transcription is not configured.' }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    // Decode base64 -> bytes, no disk write, in-memory only
    const binary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const ext = (mimeType || '').includes('mp4') ? 'mp4' : (mimeType || '').includes('webm') ? 'webm' : 'm4a';

    const form = new FormData();
    form.append('file', new Blob([binary], { type: mimeType || 'audio/m4a' }), `clip.${ext}`);
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');

    const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(JSON.stringify({ error: `Transcription failed: ${errText.slice(0, 200)}` }), {
        status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const data = await groqRes.json();
    // audio bytes (`binary`) go out of scope here and are never written anywhere
    return new Response(JSON.stringify({ text: data.text || '' }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Transcription error.' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
