// supabase/functions/forge/index.ts
// The Map Forge: generates map images with Gemini's image model, for the DM only.
// Body: { prompt, images?: [{ data, mimeType }], aspectRatio? }. images are the continuation canvas (the edge of the
// map being extended, placed where the new map continues it) and/or a style reference (the current map, smaller).
// Returns { image: { data, mimeType } } or { error: { message } }.
// The API key lives only here (Supabase secret GEMINI_API_KEY, the same one the Scribe uses).
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const MODELS = ['gemini-2.5-flash-image', 'gemini-2.5-flash-image-preview'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    // Only DM tiers may generate maps (each one costs).
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: { message: 'The archives do not answer strangers.' } }, 401);
    const { data: role } = await supabase.rpc('current_gate_role');
    if (!['admin', 'architect', 'creator'].includes(String(role))) return json({ error: { message: 'Only the Architect may forge maps.' } }, 403);

    const { prompt, images = [], aspectRatio = '3:2' } = await req.json();
    if (!prompt || typeof prompt !== 'string') return json({ error: { message: 'A prompt is required.' } }, 400);
    const parts: unknown[] = [{ text: prompt }];
    for (const img of (Array.isArray(images) ? images : []).slice(0, 3)) {
      if (img?.data && img?.mimeType) parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
    }

    let last = '';
    for (const model of MODELS) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') || '' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio } },
        }),
      });
      const data = await res.json();
      if (!res.ok) { last = data?.error?.message || `Status ${res.status}`; if (res.status === 404) continue; return json({ error: { message: last } }, res.status); }
      const out = (data?.candidates?.[0]?.content?.parts || []).find((p: { inlineData?: { data: string } }) => p?.inlineData?.data);
      if (!out) { last = data?.candidates?.[0]?.finishReason || 'No image came back.'; continue; }
      return json({ image: { data: out.inlineData.data, mimeType: out.inlineData.mimeType || 'image/png' } });
    }
    return json({ error: { message: `The forge returned no image: ${last}` } }, 502);
  } catch (e) {
    return json({ error: { message: (e as Error)?.message || 'Forge failed.' } }, 500);
  }
});
